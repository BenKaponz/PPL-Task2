import fs from "fs";
import { expect } from 'chai';
import {  evalL3program } from '../src/L3/L3-eval';
import { Value } from "../src/L3/L3-value";
import { Result, bind, isFailure, isOk, makeOk } from "../src/shared/result";
import { parseL3 } from "../src/L3/L3-ast";




const q23: string = fs.readFileSync(__dirname + '/../src/q23.l3', { encoding: 'utf-8' });

const evalP = (x: string): Result<Value> =>
    bind(parseL3(x), evalL3program);

describe('Q23 Tests', () => {
    
   it("Q23 test 1", () => {
        expect(evalP(`(L3 ` + q23 + ` (get (dict '((a . 1) (b . 2))) 'b))`)).to.deep.equal(makeOk(2));
    });

    it("Q23 test 2", () => {
        expect(evalP(`(L3 ` + q23 + ` (dict? (dict '((a . 1) (b . 2)))))`)).to.deep.equal(makeOk(true));
    });

    it("Q23 test 3", () => {
        expect(evalP(`(L3 ` + q23 + ` (dict? '((1 . a) (2 . b))))`)).to.deep.equal(makeOk(false));
    });

    it("Q23 test 4", () => {
        expect(evalP(`(L3 ` + q23 + ` 
            (is-error? (get (dict '((a . 1) (b . 2))) 'c)))`
        )).to.deep.equal(makeOk(true));
    });

    it("Q23 test 5", () => {
        expect(evalP(`(L3 ` + q23 + `
                      (define d1 (dict '((a . 1) (b . 3))))
                      (define d2 (dict '((a . 1) (b . 2))))
                      (eq? d1 d2))`)).to.deep.equal(makeOk(false));
    }); 

    it("Q23 test 6", () => {
        expect(evalP(`(L3 ` + q23 + ` 
            (define x 1)
            (get 
              (if (< x 0)
                (dict '((a . 1) (b . 2)))
                (dict '((a . 2) (b . 1))))
            'a))`)).to.deep.equal(makeOk(2));
    });

    it("Q23 test 7", () => {
        expect(evalP(`(L3 ` + q23 + `  
            (bind (get (dict '((a . 1) (b . 2))) 'b) (lambda (x) (* x x))))`
        )).to.deep.equal(makeOk(4));
    });

    it("Q23 test 8 - get on single-element dict", () => {
        expect(evalP(`(L3 ` + q23 + ` (get (dict '((z . 99))) 'z))`)).to.deep.equal(makeOk(99));
    });
    
    it("Q23 test 9 - get on missing key returns error", () => {
        expect(evalP(`(L3 ` + q23 + ` (is-error? (get (dict '((a . 1))) 'b)))`)).to.deep.equal(makeOk(true));
    });
    
    it("Q23 test 10 - dict? on empty list", () => {
        expect(evalP(`(L3 ` + q23 + ` (dict? '()))`)).to.deep.equal(makeOk(true));
    });
    
    it("Q23 test 11 - dict? on non-pair list", () => {
        expect(evalP(`(L3 ` + q23 + ` (dict? '(a b c)))`)).to.deep.equal(makeOk(false));
    });
    
    it("Q23 test 12 - equality of identical dicts", () => {
        expect(evalP(`(L3 ` + q23 + `
            (define d (dict '( (a . 1) (b . 2) ) ) )
            (eq? d d)
            )`)).to.deep.equal(makeOk(true));
    });
    
    it("Q23 test 13 - apply function to dict value", () => {
        expect(evalP(`(L3 ` + q23 + `
                        (bind 
                            ( get (dict '((foo . 5)) ) 'foo )
                            ( lambda (x) (+ x 10) )
                        )
                    )`)).to.deep.equal(makeOk(15));
    });
    
    it("Q23 test 14 - nested get returns correct value", () => {
        expect(evalP(`(L3 ` + q23 + `
            (get (dict '((a . (dict '((x . 7))))))
                 'a))`)).to.satisfy((x: Result<Value>) => isOk(x));
    });
    
    it("Q23 test 15 - bind with missing key returns error", () => {
        expect(evalP(`(L3 ` + q23 + `
            (bind (get (dict '((a . 1))) 'z)
                  (lambda (x) (* x 2)))`)).to.satisfy(isFailure);
    });
    
    it("Q23 test 17 - dict with string values", () => {
        expect(evalP(`(L3 ` + q23 + ` (get (dict '((k . "v"))) 'k))`)).to.deep.equal(makeOk("v"));
    });
    
    it("Q23 test 18 - dict? on malformed dotted list", () => {
        expect(evalP(`(L3 ` + q23 + ` (dict? '(a . 1)))`)).to.deep.equal(makeOk(false));
    });
    
    it("Q23 test 19 - get from dict with boolean value", () => {
        expect(evalP(`(L3 ` + q23 + ` (get (dict '((flag . #t))) 'flag))`)).to.deep.equal(makeOk(true));
    });
    
    it("Q23 test 20 - redefine dicts and compare", () => {
        expect(evalP(`(L3 ` + q23 + `
            (define d1 (dict '((a . 1))))
            (define d2 (dict '((a . 1))))
            (eq? d1 d2))`)).to.deep.equal(makeOk(false));
    });
    
    it("Q23 test 21 - bind with string value", () => {
        expect(evalP(`(L3 ` + q23 + `
                        (bind 
                            (get (dict '((name . "Bob"))) 'name)
                            (lambda (x) (string=? x "Bob") ) 
                        )
                       )`)).to.deep.equal(makeOk(true));
    });

    it("Q23 test 22 - get from nested dict with bind", () => {
        expect(evalP(`(L3 ` + q23 + `
                        (define d (dict '((inner . inner)) ) )
                        (dict? d)
                    )`)).to.deep.equal(makeOk(true));
    });

    it("Q23 test 23 - get from nested dict with bind", () => {
        expect(evalP(`(L3 ` + q23 + `
                        (define inner (dict '((z . 9))))
                        (define outer (dict (cons (cons 'inner inner) '())))
                        (bind 
                            (get outer 'inner)
                            (lambda (x) (dict? x))
                        )
                    )`)).to.deep.equal(makeOk(true));
    });

    it("Q23 test 23 - get from nested dict with bind", () => {
        expect(evalP(`(L3 ` + q23 + `
                        (define x 5)
                        (define outer '((x . x)))
                        (cdr (car outer))
                    )`)).to.deep.equal(makeOk({ tag: "SymbolSExp", val: "x" }));
    });
});