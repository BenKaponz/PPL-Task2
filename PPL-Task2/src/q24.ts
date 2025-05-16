import {
    makeEmptySExp, makeSymbolSExp, SExpValue, makeCompoundSExp,
    makeDictValue,
    DictValue,
    SymbolSExp,
    Value,
    isDictValue
} from './L32/L32-value';

import {
    makeVarRef, makeVarDecl, makePrimOp, makeIfExp, makeLitExp,
    isDictExp, isVarRef, isLitExp, isIfExp, isProcExp, isDefineExp,
    CExp, DictExp, Exp, isStrExp, Program, isAppExp, isBoolExp, isNumExp,
    makeAppExp, makeDefineExp, isPrimOp, makeProcExp, makeProgram, AppExp, ProcExp,
    DefineExp,
    CompoundExp,
    AtomicExp,
    IfExp,
    LetExp,
    LitExp,
    isLetExp,
    makeLetExp,
    makeDictExp,
    isAtomicExp,
    isCompoundExp
} from './L32/L32-ast';
import { map } from 'ramda';

// Step 1: convert all DictExp and dict application to AppExp
export const Dict2App = (prog: Program): Program =>
    makeProgram(map(rewriteExp, prog.exps));

const rewriteExp = (exp: Exp): Exp =>
    isDefineExp(exp) ? rewriteDefExp(exp)
    : rewriteCExp(exp);


const rewriteCExp = (cExp: CExp): CExp => 
    isAtomicExp(cExp) ? cExp:
    isDictExp(cExp) ? rewriteDictExp(cExp) :
    rewriteCompoundExp(cExp);


const rewriteDefExp = (defExp : DefineExp):  DefineExp => 
    makeDefineExp(defExp.var, rewriteCExp(defExp.val));

const rewriteCompoundExp = (compExp: CompoundExp): CExp => 
    isAppExp(compExp)   ? rewriteApp(compExp) :
    isIfExp(compExp)    ? rewriteIfexp(compExp) :
    isProcExp(compExp)  ? rewriteProcExp(compExp) :
    isLetExp(compExp)   ? rewriteLetExp(compExp) :
    isLitExp(compExp)   ? compExp :
    isDictExp(compExp)  ? rewriteDictExp(compExp) :
    compExp;

const rewriteApp = (appExp : AppExp): AppExp => 
    makeAppExp(rewriteCExp(appExp.rator), map(rewriteCExp, appExp.rands));

const rewriteIfexp = (ifExp : IfExp): IfExp => 
    makeIfExp(rewriteCExp(ifExp.test), rewriteCExp(ifExp.then), rewriteCExp(ifExp.alt));

const rewriteProcExp = (procExp: ProcExp): ProcExp => 
    makeProcExp(procExp.args, map(rewriteCExp, procExp.body));

const rewriteLetExp = (letExp: LetExp): LetExp =>
    makeLetExp(letExp.bindings, map(rewriteCExp, letExp.body));

const rewriteDictExp = (dictExp: DictExp): CExp =>
  makeLitExp(
    makeDictValue(
      dictExp.entries.map(e =>
        // each entry: [SymbolSExp, Value] where Value is an SExpValue
        [ e.key, convertCExp2SExp(e.val) ]
      )
    )
  );

const entriesToSexpList = (
  entries: { key: SymbolSExp; val: CExp }[]
): SExpValue =>
  entries.reduceRight<SExpValue>(
    (acc, { key, val }) =>
      makeCompoundSExp(
        makeCompoundSExp(key, convertCExp2SExp(val)),
        acc
      ),
    makeEmptySExp()
  );

const convertCExp2SExp = (cExp: CExp): SExpValue =>
    isAtomicExp(cExp) ? convertAtomicExp2SExp(cExp) :
    convertCompExp2SExp(cExp);

const convertAtomicExp2SExp = (atomicExp: AtomicExp): SExpValue =>
    isNumExp(atomicExp)   ? atomicExp.val :
    isBoolExp(atomicExp)  ? atomicExp.val :
    isStrExp(atomicExp)   ? atomicExp.val :
    isPrimOp(atomicExp)   ? makeSymbolSExp(atomicExp.op) :
    isVarRef(atomicExp)   ? makeSymbolSExp(atomicExp.var) :
    (() => { throw new Error(`Unexpected AtomicExp ${atomicExp}`); })();

  
const convertCompExp2SExp = (ce: CompoundExp): SExpValue =>
    // Application: (rator rand1 rand2 …)
    isAppExp(ce)   ?
      [ convertCExp2SExp(ce.rator), ...ce.rands.map(convertCExp2SExp) ]
        .reduceRight<SExpValue>(
          (acc, h) => makeCompoundSExp(h, acc),
          makeEmptySExp()
        ) :

    // If: (if test then alt)
    isIfExp(ce)    ?
      [ makeSymbolSExp("if"),
        convertCExp2SExp(ce.test),
        convertCExp2SExp(ce.then),
        convertCExp2SExp(ce.alt) ]
        .reduceRight<SExpValue>(
          (acc, h) => makeCompoundSExp(h, acc),
          makeEmptySExp()
        ) :

    // Lambda: (lambda (arg1 …) body1 body2 …)
    isProcExp(ce)  ?
      [ makeSymbolSExp("lambda"),
        ce.args
          .map(v => makeSymbolSExp(v.var))
          .reduceRight<SExpValue>(
            (acc, h) => makeCompoundSExp(h, acc),
            makeEmptySExp()
          ),
        ...ce.body.map(convertCExp2SExp)
      ].reduceRight<SExpValue>(
        (acc, h) => makeCompoundSExp(h, acc),
        makeEmptySExp()
      ) :

    // Let: (let ((var1 val1) (var2 val2) …) body1 body2 …)
    isLetExp(ce)   ?
      [ makeSymbolSExp("let"),
        ce.bindings
          .map(b =>
            [ makeSymbolSExp(b.var.var),
              convertCExp2SExp(b.val) ]
            .reduceRight<SExpValue>(
              (acc, h) => makeCompoundSExp(h, acc),
              makeEmptySExp()
            )
          )
          .reduceRight<SExpValue>(
            (acc, h) => makeCompoundSExp(h, acc),
            makeEmptySExp()
          ),
        ...ce.body.map(convertCExp2SExp)
      ].reduceRight<SExpValue>(
        (acc, h) => makeCompoundSExp(h, acc),
        makeEmptySExp()
      ) :

    // Literal S-exp
    isLitExp(ce)   ? ce.val :

    // Dict literal: (dict (key1 val1) (key2 val2) …)
    isDictExp(ce)  ?
      [ makeSymbolSExp("dict"),
        ...ce.entries.map(e =>
          [ makeSymbolSExp(e.key.val),
            convertCExp2SExp(e.val) ]
          .reduceRight<SExpValue>(
            (acc, h) => makeCompoundSExp(h, acc),
            makeEmptySExp()
          )
        )
      ].reduceRight<SExpValue>(
        (acc, h) => makeCompoundSExp(h, acc),
        makeEmptySExp()
      ) :

    // Should never happen
    (() => { throw new Error(`Unexpected CompoundExp: ${ce}`); })();



    // Entry point: transform full L32 program into L3
export const L32toL3 = (prog: Program): Program =>
    makeProgram(map(rewriteExp, prog.exps));


/*

import { map } from 'ramda';
import { Result, isOk } from "./shared/result";
// import { makeProgram, Program } from './L3/L3-ast';
import { AppExp, CExp, DictExp, Exp, isAppExp, isAtomicExp, isBoolExp, isCExp, isDefineExp, isDictExp, isIfExp, isLetExp, isLitExp, isNumExp, isPrimOp, isProcExp, isProgram, isStrExp, isVarRef, LetExp, makeAppExp, makeBinding, makeDefineExp, makeIfExp, makeLetExp, makeLitExp, makePrimOp, makeProcExp, makeProgram, Program, unparseL32, VarDecl } from './L32/L32-ast';
import { CompoundSExp, EmptySExp, makeCompoundSExp, makeEmptySExp, makeSymbolSExp, SExpValue } from './L32/L32-value';
import { parseL3 } from './L3/L3-ast';
Purpose: rewrite all occurrences of DictExp in a program to AppExp.
Signature: Dict2App (exp)
Type: Program -> Program

export const Dict2App  = (exp: Program) : Program =>
    makeProgram(map(rewriteAllDictExp, exp.exps));

export const rewriteDictExp = (e: DictExp): AppExp => {
    const pairs = e.pairs.map(({ key, val }) =>
        makeCompoundSExp(makeSymbolSExp(key.var), wrapCExpAsSExpValue(val))
    );

    const dictSym = makeSymbolSExp("dict");
    const dictList = listToSExp([dictSym, ...pairs]);
    const quoted = makeLitExp(dictList);

    return makeAppExp(makeProcExp([], [quoted]), []);
};

const rewriteAllDictExp = (exp: Exp): Exp =>
    isDefineExp(exp) ? makeDefineExp(exp.var, rewriteAllDictCExp(exp.val)) :
    isCExp(exp) ? rewriteAllDictCExp(exp) :
    exp;

const rewriteAllDictCExp = (exp: CExp): CExp =>
    isAtomicExp(exp) ? exp :
    isLitExp(exp) ? exp :
    isIfExp(exp) ? makeIfExp(rewriteAllDictCExp(exp.test),
                                rewriteAllDictCExp(exp.then),
                                rewriteAllDictCExp(exp.alt)) :
    isAppExp(exp) ? makeAppExp(rewriteAllDictCExp(exp.rator),
                                map(rewriteAllDictCExp, exp.rands)) :
    isProcExp(exp) ? makeProcExp(exp.args, map(rewriteAllDictCExp, exp.body)) :
    isLetExp(exp) ? makeLetExp(
                        exp.bindings.map(b => makeBinding(b.var.var, rewriteAllDictCExp(b.val))),
                        map(rewriteAllDictCExp, exp.body)) :
    isDictExp(exp) ? rewriteDictExp(exp) :
    exp;


    export const wrapCExpAsSExpValue = (cexp: CExp): SExpValue => {
        if (isLitExp(cexp)) {
            return cexp.val;
        } else if (cexp.tag === "NumExp" || cexp.tag === "BoolExp" || cexp.tag === "StrExp") {
            return cexp.val;
        } else if (isAtomicExp(cexp)) {
            return makeSymbolSExp(cexp.tag === "VarRef" ? cexp.var : cexp.op);
        } else if (isAppExp(cexp)) {
            const rator = wrapCExpAsSExpValue(cexp.rator);
            const rands = cexp.rands.map(wrapCExpAsSExpValue);
            return listToSExp([rator, ...rands]);
        } else if (isIfExp(cexp)) {
            return listToSExp([
                makeSymbolSExp("if"),
                wrapCExpAsSExpValue(cexp.test),
                wrapCExpAsSExpValue(cexp.then),
                wrapCExpAsSExpValue(cexp.alt)
            ]);
        } else if (isProcExp(cexp)) {
            const args = cexp.args.map(v => makeSymbolSExp(v.var));
            const body = cexp.body.map(wrapCExpAsSExpValue);
            return listToSExp([
                makeSymbolSExp("lambda"),
                listToSExp(args),
                ...body
            ]);
        } else if (isDictExp(cexp)) {
            const pairs = cexp.pairs.map(({ key, val }) =>
                listToSExp([makeSymbolSExp(key.var), wrapCExpAsSExpValue(val)])
            );
            return listToSExp([makeSymbolSExp("dict"), ...pairs]);            
        } else {
            throw new Error(Unsupported CExp: ${JSON.stringify(cexp)});
        }
    };
    
    
const listToSExp = (xs: SExpValue[]): SExpValue =>
    xs.reduceRight<SExpValue>((acc, val) => makeCompoundSExp(val, acc), makeEmptySExp());
    
    


export const L32toL3 = (prog : Program): Program => {
    const l32Text: string = unparseL32(Dict2App(prog));
    const l3Text: string = l32Text.replace(/^\(L32/, "(L3");
    const r: Result<Program> = parseL3(l3Text);
    return resultToProgram(r);
}

const resultToProgram = (res: Result<Program>): Program => {
    if (isOk(res)) {
        return res.value;
    } else {
        throw new Error("Failed to parse program: " + res.message);
    }
};
*/
