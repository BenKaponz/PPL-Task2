import { reduce } from "ramda";
import { PrimOp } from "./L31-ast";
import { isCompoundSExp, isEmptySExp, isSymbolSExp, makeCompoundSExp, makeEmptySExp, CompoundSExp, EmptySExp, Value, makeSymbolSExp, SymbolSExp } from "./L31-value";
import { List, allT, first, isNonEmptyList, rest } from '../shared/list';
import { isBoolean, isNumber, isString } from "../shared/type-predicates";
import { Result, makeOk, makeFailure } from "../shared/result";
import { format } from "../shared/format";


export const applyPrimitive = (proc: PrimOp, args: Value[]): Result<Value> =>
    proc.op === "+" ? (allT(isNumber, args) ? makeOk(reduce((x, y) => x + y, 0, args)) : 
                                              makeFailure(`+ expects numbers only: ${format(args)}`)) :
    proc.op === "-" ? minusPrim(args) :
    proc.op === "*" ? (allT(isNumber, args) ? makeOk(reduce((x, y) => x * y, 1, args)) : 
                                              makeFailure(`* expects numbers only: ${format(args)}`)) :
    proc.op === "/" ? divPrim(args) :
    proc.op === ">" ? makeOk(args[0] > args[1]) :
    proc.op === "<" ? makeOk(args[0] < args[1]) :
    proc.op === "=" ? makeOk(args[0] === args[1]) :
    proc.op === "not" ? makeOk(!args[0]) :
    proc.op === "and" ? isBoolean(args[0]) && isBoolean(args[1]) ? makeOk(args[0] && args[1]) : 
                                                                   makeFailure(`Arguments to "and" not booleans: ${format(args)}`) :
    proc.op === "or" ? isBoolean(args[0]) && isBoolean(args[1]) ? makeOk(args[0] || args[1]) : 
                                                                  makeFailure(`Arguments to "or" not booleans: ${format(args)}`) :
    proc.op === "eq?" ? makeOk(eqPrim(args)) :
    proc.op === "string=?" ? makeOk(args[0] === args[1]) :
    proc.op === "cons" ? makeOk(consPrim(args[0], args[1])) :
    proc.op === "car" ? carPrim(args[0]) :
    proc.op === "cdr" ? cdrPrim(args[0]) :
    proc.op === "list" ? makeOk(listPrim(args)) :
    proc.op === "pair?" ? makeOk(isPairPrim(args[0])) :
    proc.op === "number?" ? makeOk(typeof (args[0]) === 'number') :
    proc.op === "boolean?" ? makeOk(typeof (args[0]) === 'boolean') :
    proc.op === "symbol?" ? makeOk(isSymbolSExp(args[0])) :
    proc.op === "string?" ? makeOk(isString(args[0])) :
    // 2.1.c
    proc.op === "dict" ? (args.length === 1 && isDictPrim(args[0]) ? makeOk(dictPrim(args[0])) :
        makeFailure(`dict expects exactly one argument of compound SExp: ${format(args)}`)) :

    proc.op === "get" ? (args.length === 2 && isCompoundSExp(args[0]) && isSymbolSExp(args[1]) ? applyGet(args[0], args[1].val) :
        makeFailure(`get expects a dictionary and a symbol: ${format(args)}`)) :

    proc.op === "dict?" ? (args.length === 1 ? makeOk(isDictPrim(args[0])) :
        makeFailure(`dict? expects exactly one argument: ${format(args)}`)) :

    makeFailure(`Bad primitive op: ${format(proc.op)}`);

// Functions added for the new prim ops //
const dictPrim = (val: Value): CompoundSExp =>
    isCompoundSExp(val) ? val : makeCompoundSExp(val, makeEmptySExp());

const isDictPrim = (val: Value): boolean =>
    isEmptySExp(val) || isCompoundSExp(val) && isValidDict(val) && !hasDuplicateKeys(val);

const isValidDict = (val: Value): boolean =>
    isEmptySExp(val) || 
        (isCompoundSExp(val) &&
            isCompoundSExp(val.val1) && isSymbolSExp(val.val1.val1) &&
                isValidDict(val.val2)); 

const hasDuplicateKeys = (dict: CompoundSExp): boolean => {
    const collectKeys = (d: CompoundSExp): SymbolSExp[] => {
        const pair = d.val1 as CompoundSExp;
        const key = pair.val1 as SymbolSExp;

        return isEmptySExp(d.val2)
            ? [key]
            : [key].concat(collectKeys(d.val2 as CompoundSExp));
    };

    const keys: SymbolSExp[] = collectKeys(dict);
    const vals: string[] = keys.map(sym => sym.val);
    return new Set(vals).size !== vals.length;
};

const applyGet = (dict: Value, key: string): Result<Value> =>
    isCompoundSExp(dict) && isDictPrim(dict)
        ? findInDict(dict, makeSymbolSExp(key))
        : makeFailure(`Error: invalid dictionary or key: ${format(dict)}, ${key}`);
        
const findInDict = (dict: CompoundSExp, key: SymbolSExp): Result<Value> =>
    isEmptySExp(dict.val2)
        ? (isCompoundSExp(dict.val1) && isSymbolSExp(dict.val1.val1) && dict.val1.val1.val === key.val
            ? makeOk(dict.val1.val2)
            : makeFailure(`get: Key not found in dictionary: ${format(key)}`))
        : (isCompoundSExp(dict.val1) && isSymbolSExp(dict.val1.val1) && dict.val1.val1.val === key.val
            ? makeOk(dict.val1.val2)
            : isCompoundSExp(dict.val2)
                ? findInDict(dict.val2, key)
                : makeFailure(`get: Key not found in dictionary: ${format(key)}`));

//
                


const minusPrim = (args: Value[]): Result<number> => {
    // TODO complete
    const x = args[0], y = args[1];
    if (isNumber(x) && isNumber(y)) {
        return makeOk(x - y);
    }
    else {
        return makeFailure(`Type error: - expects numbers ${format(args)}`);
    }
};

const divPrim = (args: Value[]): Result<number> => {
    // TODO complete
    const x = args[0], y = args[1];
    if (isNumber(x) && isNumber(y)) {
        return makeOk(x / y);
    }
    else {
        return makeFailure(`Type error: / expects numbers ${format(args)}`);
    }
};

const eqPrim = (args: Value[]): boolean => {
    const x = args[0], y = args[1];
    if (isSymbolSExp(x) && isSymbolSExp(y)) {
        return x.val === y.val;
    }
    else if (isEmptySExp(x) && isEmptySExp(y)) {
        return true;
    }
    else if (isNumber(x) && isNumber(y)) {
        return x === y;
    }
    else if (isString(x) && isString(y)) {
        return x === y;
    }
    else if (isBoolean(x) && isBoolean(y)) {
        return x === y;
    }
    else {
        return false;
    }
};

const carPrim = (v: Value): Result<Value> => 
    isCompoundSExp(v) ? makeOk(v.val1) :
    makeFailure(`Car: param is not compound ${format(v)}`);

const cdrPrim = (v: Value): Result<Value> =>
    isCompoundSExp(v) ? makeOk(v.val2) :
    makeFailure(`Cdr: param is not compound ${format(v)}`);

const consPrim = (v1: Value, v2: Value): CompoundSExp =>
    makeCompoundSExp(v1, v2);

export const listPrim = (vals: List<Value>): EmptySExp | CompoundSExp =>
    isNonEmptyList<Value>(vals) ? makeCompoundSExp(first(vals), listPrim(rest(vals))) :
    makeEmptySExp();

const isPairPrim = (v: Value): boolean =>
    isCompoundSExp(v);
