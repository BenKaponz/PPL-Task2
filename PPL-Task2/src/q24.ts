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
    isAppExp(ce)   ?
      [ convertCExp2SExp(ce.rator), ...ce.rands.map(convertCExp2SExp) ]
        .reduceRight<SExpValue>(
          (acc, h) => makeCompoundSExp(h, acc),
          makeEmptySExp()
        ) :

    isIfExp(ce)    ?
      [ makeSymbolSExp("if"),
        convertCExp2SExp(ce.test),
        convertCExp2SExp(ce.then),
        convertCExp2SExp(ce.alt) ]
        .reduceRight<SExpValue>(
          (acc, h) => makeCompoundSExp(h, acc),
          makeEmptySExp()
        ) :

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

    isLitExp(ce)   ? ce.val :

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

