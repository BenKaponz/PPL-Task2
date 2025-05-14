import { Exp, Program, isProgram, isDefineExp, isCExp, CExp, isNumExp, isBoolExp, isStrExp, isPrimOp, isVarRef, isAppExp, isIfExp, isProcExp, makeVarDecl } from './L3-ast';
import { VarDecl } from './L32/L32-ast';
import { Result, makeOk, makeFailure } from './shared/result';

export const l2ToJS = (exp: Exp | Program): Result<string> => {
    return isProgram(exp) ? l2ProgramToJS(exp) : l2ExpToJS(exp);
};

const l2ProgramToJS = (prog: Program): Result<string> => {
    const exps = prog.exps;
    const jsLines = exps.map(l2ExpToJS);

    // Check for errors
    if (jsLines.some((r: Result<string>) => r.tag !== 'Ok' && r.tag !== 'Failure')) {
        return makeFailure("One or more expressions failed to convert");
    }

    const lines = jsLines.map(r => (r as any).value);
    return makeOk(lines.slice(0, -1).map(l => `${l};`).concat(lines[lines.length - 1]).join('\n'));
};

const l2ExpToJS = (exp: Exp): Result<string> => {
    if (isDefineExp(exp)) {
        return bind(l2CExpToJS(exp.val), val => makeOk(`const ${exp.var.var} = ${val}`));
    }
    return l2CExpToJS(exp);
};

const l2CExpToJS = (exp: CExp): Result<string> => {
    if (isNumExp(exp)) return makeOk(exp.val.toString());
    if (isBoolExp(exp)) return makeOk(exp.val ? "true" : "false");
    if (isStrExp(exp)) return makeOk(`"${exp.val}"`);
    if (isVarRef(exp)) return makeOk(exp.var);
    if (isPrimOp(exp)) return makeOk(exp.op);

    if (isIfExp(exp)) {
        return bind(l2CExpToJS(exp.test), test =>
            bind(l2CExpToJS(exp.then), then =>
                bind(l2CExpToJS(exp.alt), alt =>
                    makeOk(`(${test} ? ${then} : ${alt})`)
                )));
    }

    if (isProcExp(exp)) {
        const args = exp.args.map((v: VarDecl) => v.var).join(",");
        return bind(l2CExpToJS(exp.body[0]), body =>
            makeOk(`(${args}) => ${body}`));
    }

    if (isAppExp(exp)) {
        return bind(l2CExpToJS(exp.rator), rator =>
            bind(mapResult(l2CExpToJS, exp.rands), args =>
                makeOk(`${rator}(${args.join(",")})`)));
    }

    return makeFailure("Unknown expression");
};

// helper function
const mapResult = <T, U>(f: (x: T) => Result<U>, arr: T[]): Result<U[]> => {
    const results = arr.map(f);
    if (results.some(r => r.tag === 'Failure')) {
        return makeFailure("mapResult failure");
    }
    return makeOk(results.map((r: any) => r.value));
};

const bind = <T, U>(r: Result<T>, f: (x: T) => Result<U>): Result<U> =>
    r.tag === 'Ok' ? f(r.value) : r;
