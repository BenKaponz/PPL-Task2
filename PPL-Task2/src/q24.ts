import {
    makeEmptySExp, makeSymbolSExp, SExpValue, makeCompoundSExp
} from './L32/L32-value';

import {
    makeVarRef, makeVarDecl, makePrimOp, makeIfExp, makeLitExp,
    isDictExp, isVarRef, isLitExp, isIfExp, isProcExp, isDefineExp,
    CExp, DictExp, Exp, isStrExp, Program, isAppExp, isBoolExp, isNumExp,
    makeAppExp, makeDefineExp, isPrimOp, makeProcExp, makeProgram, AppExp, ProcExp
} from './L32/L32-ast';

// Entry point: transform full L32 program into L3
export const L32toL3 = (prog: Program): Program =>
    makeProgram([makeDictFunctionDefinition(), ...Dict2App(prog).exps]);

// Step 1: convert all DictExp and dict application to AppExp
export const Dict2App = (prog: Program): Program =>
    makeProgram(prog.exps.map(rewriteExp));

const rewriteExp = (exp: Exp): Exp =>
    isDefineExp(exp)
        ? makeDefineExp(exp.var, rewriteCExp(exp.val))
        : rewriteCExp(exp);

const rewriteCExp = (exp: CExp): CExp =>
    isDictExp(exp) ? rewriteDict(exp) :
    isAppExp(exp) ? rewriteApp(exp) :
    isIfExp(exp) ? makeIfExp(rewriteCExp(exp.test), rewriteCExp(exp.then), rewriteCExp(exp.alt)) :
    isProcExp(exp) ? makeProcExp(exp.args, exp.body.map(rewriteCExp)) :
    exp;

const rewriteApp = (app: AppExp): CExp => {
    const rator = rewriteCExp(app.rator);
    const rands = app.rands.map(rewriteCExp);

    if (isDictExp(app.rator) || isIfExp(app.rator)) {
        return makeAppExp(makeVarRef("get"), [rewriteCExp(app.rator), ...rands]);
    }
    return makeAppExp(rator, rands);
};

const rewriteDict = (d: DictExp): CExp => {
    const quotedList = d.entries.reduceRight<SExpValue>((acc, e) =>
        makeCompoundSExp(
            makeCompoundSExp(makeSymbolSExp(e.key.val), convertToSExp(e.val)),
            acc
        ), makeEmptySExp());
    return makeAppExp(makeVarRef("dict"), [makeLitExp(quotedList)]);
};

const convertToSExp = (val: CExp): SExpValue =>
    isNumExp(val) ? val.val :
    isBoolExp(val) ? val.val :
    isStrExp(val) ? val.val :
    isVarRef(val) ? makeSymbolSExp(val.var) :
    isLitExp(val) ? val.val :
    isPrimOp(val) ? makeSymbolSExp(val.op) :
    isAppExp(val) ? [val.rator, ...val.rands].map(convertToSExp).reduceRight((acc, curr) => makeCompoundSExp(curr, acc), makeEmptySExp()) :
    isProcExp(val) ? convertProc(val) :
    makeSymbolSExp("unknown");

const convertProc = (proc: ProcExp): SExpValue => {
    const argsList = proc.args.map(a => makeSymbolSExp(a.var)).reduceRight((acc, curr) => makeCompoundSExp(curr, acc), makeEmptySExp());
    const bodyList = proc.body.map(convertToSExp).reduceRight((acc, curr) => makeCompoundSExp(curr, acc), makeEmptySExp());
    return makeCompoundSExp(makeSymbolSExp("lambda"), makeCompoundSExp(argsList, bodyList));
};

// === Runtime Implementation for dict ===
const makeDictFunctionDefinition = (): Exp =>
    makeDefineExp(makeVarDecl("dict"),
        makeProcExp([makeVarDecl("pairs")],
            [makeProcExp([makeVarDecl("k")],
                [makeIfExp(
                    makeAppExp(makePrimOp("eq?"), [
                        makeAppExp(makePrimOp("car"), [makeAppExp(makePrimOp("car"), [makeVarRef("pairs")])]),
                        makeVarRef("k")]),
                    makeAppExp(makePrimOp("cdr"), [makeAppExp(makePrimOp("car"), [makeVarRef("pairs")])]),
                    makeAppExp(makeAppExp(makeVarRef("dict"), [makeAppExp(makePrimOp("cdr"), [makeVarRef("pairs")])]), [makeVarRef("k")])
                )]
            )]
        )
    );