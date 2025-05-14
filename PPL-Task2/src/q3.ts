import { 
    Exp, Program, ProcExp, LetExp, LitExp, VarDecl , AppExp, AtomicExp, CompoundExp, DefineExp, IfExp, PrimOp ,
    isProgram, isDefineExp, isCExp, CExp, isNumExp, isBoolExp, isStrExp, isPrimOp, isVarRef, isAppExp,
    isIfExp, isProcExp, isAtomicExp , isCompoundExp, isLetExp, isLitExp
 } from './L3/L3-ast';
import { Closure, isEmptySExp, isSymbolSExp, SExpValue, isSExp, isClosure } from './L3/L3-value';
import { Result, makeOk, makeFailure } from './shared/result';

/*
Purpose: Transform L2 AST to JavaScript program string
Signature: L2ToJS(L2AST)
Type: [Exp | Program] => Result<string>
*/

export const l2ToJS = (exp: Exp | Program): Result<string> =>
    isProgram(exp) ? parseProgram(exp) :
    isDefineExp(exp) ? parseDefine(exp) :
    isCExp(exp) ? parseCExp(exp) :
    makeFailure("Unsupported expression");

const parseProgram = (prog: Program): Result<string> => {
    const parsed = prog.exps.map(l2ToJS);
    for (const r of parsed) {
        if (r.tag === "Failure") return r;
    }
    return makeOk(parsed.map(r => (r as any).value).join(";\n"));
};

const parseDefine = (defExp: DefineExp): Result<string> => {
    const varRes = parseVar(defExp.var);
    const valRes = parseCExp(defExp.val);

    return (varRes.tag === "Ok" && valRes.tag === "Ok") ? makeOk(`const ${varRes.value} = ${valRes.value}`) :
    (varRes.tag === "Failure") ? varRes :
    valRes;
};

const parseVar = (varExp: VarDecl) : Result<string> =>
    makeOk(varExp.var)

const parseCExp = (cExp: CExp) : Result<string> => 
    isCompoundExp(cExp) ? parseCompoundExp(cExp) : 
    isAtomicExp(cExp) ? parseAtomic(cExp) : 
    makeFailure("Unknown CExp");

const parseAtomic = (atomicExp: AtomicExp): Result<string> => 
    isNumExp(atomicExp) ? makeOk(atomicExp.val.toString()) :
    isBoolExp(atomicExp) ? makeOk(atomicExp.val ? "true" : "false") :
    isStrExp(atomicExp) ? makeOk(atomicExp.val) :
    isPrimOp(atomicExp) ? parsePrimOp(atomicExp) :
    isVarRef(atomicExp) ? makeOk(atomicExp.var) :
    makeFailure("Unknown Atomic Expression");


const parseCompoundExp = (compExp: CompoundExp): Result<string> =>
    isIfExp(compExp) ? parseIfExp(compExp) :
    isAppExp(compExp) ? parseAppExp(compExp) :
    isProcExp(compExp) ? parseProcExp(compExp) :
    isLetExp(compExp) ? parseLetExp(compExp) :
    isLitExp(compExp) ? parseLitExp(compExp) :
    makeFailure("Unknown Compound Expression");


const parseIfExp = (ifExp: IfExp): Result<string> => {
    const test = parseCExp(ifExp.test);
    const thenBranch = parseCExp(ifExp.then);
    const altBranch = parseCExp(ifExp.alt);

    if (test.tag === "Ok" && thenBranch.tag === "Ok" && altBranch.tag === "Ok") {
        return makeOk(`(${test.value} ? ${thenBranch.value} : ${altBranch.value})`);
    } else if (test.tag === "Failure") {
        return test;
    } else if (thenBranch.tag === "Failure") {
        return thenBranch;
    } else {
        return altBranch;
    }
};

const parseAppExp = (appExp: AppExp): Result<string> => {
    const rator = parseCExp(appExp.rator);
    const rands = appExp.rands.map(parseCExp);

    if (rator.tag !== "Ok") return rator;
    for (const r of rands) {
        if (r.tag === "Failure") return r;
    }

    const op = rator.value;
    const args = rands.map(r => (r as any).value);
    const infixOps = ["+", "-", "*", "/", ">", "<", "===", "&&", "||"];

    return infixOps.includes(op)
        ? makeOk(`(${args.join(` ${op} `)})`)
        : op === "!" && args.length === 1
            ? makeOk(`(!${args[0]})`)
            : makeOk(`${op}(${args.join(",")})`);
};



const parseProcExp = (procExp: ProcExp): Result<string> => {
    const params = procExp.args.map(v => v.var).join(",");
    const body = procExp.body.map(parseCExp);

    for (const r of body) {
        if (r.tag === "Failure") return r;
    }

    const bodyStrs = body.map(r => (r as any).value);
    return bodyStrs.length === 1
        ? makeOk(`((${params}) => ${bodyStrs[0]})`)
        : makeOk(`((${params}) => { ${bodyStrs.slice(0, -1).join(";")}; return ${bodyStrs[bodyStrs.length - 1]}; })`);
};

const parseLetExp = (letExp: LetExp): Result<string> => {
    const bindings = letExp.bindings;

    const parsedBindings = bindings.map(b => ({
        var: b.var.var,
        val: parseCExp(b.val)
    }));

    for (const b of parsedBindings) {
        if (b.val.tag === "Failure") return b.val;
    }

    const jsBindings = parsedBindings.map(b => `const ${b.var} = ${(b.val as any).value};`).join(" ");
    const bodyResults = letExp.body.map(parseCExp);

    for (const r of bodyResults) {
        if (r.tag === "Failure") return r;
    }

    const body = bodyResults.map(r => (r as any).value).join(";");
    return makeOk(`(() => { ${jsBindings} return ${body}; })()`);
};
//export type SExpValue = Closure;

const parseLitExp = (litExp: LitExp): Result<string> => 
    isSExp(litExp.val) ?  parseSExp(litExp.val) :
    makeFailure("Unknown LitExp expression");

    const parseSExp = (sExp: SExpValue): Result<string> =>
    typeof sExp === "string" ? makeOk(`"${sExp}"`) :
    typeof sExp === "number" ? makeOk(sExp.toString()) :
    typeof sExp === "boolean" ? makeOk(sExp ? "true" : "false") :
    typeof sExp === "object" && sExp !== null && "tag" in sExp ? (
        sExp.tag === "SymbolSExp" ? makeOk(`"${sExp.val}"`) :
        sExp.tag === "EmptySExp" ? makeOk("[]") :
        sExp.tag === "CompoundSexp" ? makeFailure("Compound S-expression not supported in JS") :
        sExp.tag === "Closure" ? parseClosure(sExp) :
        makeFailure(`Unknown tagged object in SExpValue: ${sExp.tag}`)
    ) :
    "op" in sExp ? parsePrimOp(sExp as PrimOp) :
    makeFailure("Unknown SExpValue expression");
/*
const parseSExp = (sExp: SExpValue): Result<string> =>
    isStrExp(sExp) ? makeOk(sExp.val) :
    isNumExp(sExp) ? makeOk(sExp.val.toString()) :
    isBoolExp(sExp) ? makeOk(sExp.val ? "true" : "false") :
    isPrimOp(sExp) ? parsePrimOp(sExp) :
    isClosure(sExp) ? parseClosure(sExp) :
    isSymbolSExp(sExp) ? makeOk(sExp.val) :
    isEmptySExp(sExp) ? makeOk("[]") :
    isCompoundExp(sExp) ? parseCompoundExp(sExp) :
    makeFailure("Unknown SExpValue expression");
*/

const parsePrimOp = (primOp: PrimOp): Result<string> =>
    primOp.op === "eq?" ? makeOk("===") :
    primOp.op === "+" ? makeOk("+") :
    primOp.op === "-" ? makeOk("-") :
    primOp.op === "*" ? makeOk("*") :
    primOp.op === "/" ? makeOk("/") :
    primOp.op === ">" ? makeOk(">") :
    primOp.op === "<" ? makeOk("<") :
    primOp.op === "=" ? makeOk("===") :
    primOp.op === "not" ? makeOk("!") :
    primOp.op === "number?" ? makeOk("((x) => typeof(x) === 'number')") :
    primOp.op === "boolean?" ? makeOk("((x) => typeof(x) === 'boolean')") :
    primOp.op === "string?" ? makeOk("((x) => typeof(x) === 'string')") :
    primOp.op === "symbol?" ? makeOk("((x) => (typeof(x) === 'string' && !['true','false'].includes(x)))") :
    makeFailure(`Unknown L2 primitive operator: ${primOp.op}`);


const parseClosure = (closure: Closure): Result<string> => {
    const params = closure.params.map(p => p.var).join(", ");
    const bodyResults = closure.body.map(parseCExp);

    for (const r of bodyResults) {
        if (r.tag === "Failure") return r;
    }

    const bodyStr = bodyResults.map(r => (r as any).value).join("; ");
    return makeOk(`((${params}) => (${bodyStr}))`);
};
