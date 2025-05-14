import { Program, Exp, isDefineExp, makeDefineExp, CExp, isAtomicExp, isIfExp, makeIfExp, isProcExp, makeProcExp, isLetExp, makeLetExp, isAppExp, makeAppExp, isDictExp, DictExp, makeVarRef, makeLitExp, makeProgram, Binding, isLitExp, isNumExp, isBoolExp, isVarRef, isStrExp, unparseL32 } from './L32/L32-ast';
import { SExpValue, makeCompoundSExp, makeEmptySExp, makeSymbolSExp } from './L3/L3-value';
import { parseL3 } from './L3/L3-ast';
import * as fs from 'fs';
import { isOk, Result } from './shared/result';
/*
Purpose: rewrite all occurrences of DictExp in a program to AppExp.
Signature: Dict2App (exp)
Type: Program -> Program
*/
export const Dict2App  = (exp: Program) : Program =>
    //@TODO
    makeProgram(exp.exps.map(rewriteExp));


const rewriteExp = (exp: Exp): Exp =>
    isDefineExp(exp) ? makeDefineExp(exp.var, rewriteCExp(exp.val)) : rewriteCExp(exp);

const rewriteCExp = (exp: CExp): CExp =>
    isAtomicExp(exp) ? exp :
    isIfExp(exp) ? makeIfExp(rewriteCExp(exp.test), rewriteCExp(exp.then), rewriteCExp(exp.alt)) :
    isProcExp(exp) ? makeProcExp(exp.args, exp.body.map(rewriteCExp)) :
    isLetExp(exp) ? makeLetExp(exp.bindings.map(rewriteBinding), exp.body.map(rewriteCExp)) :
    isDictExp(exp) ? rewriteDict(exp) :
    isAppExp(exp) ? rewriteAppExp(exp) :
    exp;       

const rewriteBinding = (b: Binding): Binding =>
    ({ ...b, val: rewriteCExp(b.val) });

const rewriteDict = (d: DictExp): CExp =>
    makeAppExp(
        makeVarRef("dict"),
        [makeLitExp(entriesToSExp(d.entries))]
    );

const entriesToSExp = (entries: { key: { val: string }, val: CExp }[]): SExpValue =>
    entries.length === 0 ? makeEmptySExp() : makeCompoundSExp(
            makeCompoundSExp(
                makeSymbolSExp(entries[0].key.val),
                cexpToSExp(entries[0].val)
            ),
            entriesToSExp(entries.slice(1))
        );


const rewriteAppExp = (exp: CExp): CExp =>
    isAppExp(exp) && isDictExp(exp.rator)
        ? makeAppExp(makeVarRef("get"), [rewriteDict(exp.rator), ...exp.rands.map(rewriteCExp)])
        : makeAppExp(rewriteCExp(exp.rator), exp.rands.map(rewriteCExp));



/*
Purpose: Transform L32 program to L3
Signature: L32ToL3(prog)
Type: Program -> Program
*/
export const L32toL3 = (prog : Program): Program =>
    //@TODO
    makeProgram([]);