import fs from "fs";
import { expect } from 'chai';
import {  evalL32program } from '../src/L32/L32-eval';
import { Value, isDictValue } from "../src/L32/L32-value";
import { Result, bind, isFailure, isOk, makeFailure, makeOk } from "../src/shared/result";
import { parseL32, parseL32Exp } from "../src/L32/L32-ast";
import { makeEmptySExp } from "../src/L3/L3-value";

const evalP = (x: string): Result<Value> =>
    bind(parseL32(x), evalL32program);

describe('Q22 Tests', () => {

    it("Q22 basic tests 1", () => {
        expect(evalP(`(L32 ((dict (a 1) (b 2)) 'a))`)).to.deep.equal(makeOk(1));
    });
    
    it("Q22 tests 2", () => {
        expect(evalP(`(L32
                      (define x "a")
                      (define y "b")
                      ((dict (a x) (b y)) 'b))`)).to.deep.equal(makeOk("b"))
    });

    it("Q22 test 3", () => {
        expect(evalP(`(L32 
            (define x 1)
            (
              (if (< x 0)
                (dict (a 1) (b 2))
                (dict (a 2) (b 1)))
            'a))`)).to.deep.equal(makeOk(2));
    });

    it("Q22 basic test 4 - lookup in define-bound dict", () => {
        expect(evalP(`
          (L32
            (define d (dict (x 42) (y 100)))
            (d 'y))
        `)).to.deep.equal(makeOk(100));
      });
      
      it("Q22 basic test 5 - boolean lookup #t", () => {
        expect(evalP(`(L32 ((dict (t #t) (f #f)) 't))`))
          .to.deep.equal(makeOk(true));
      });
      
      it("Q22 basic test 6 - boolean lookup #f", () => {
        expect(evalP(`(L32 ((dict (t #t) (f #f)) 'f))`))
          .to.deep.equal(makeOk(false));
      });
      
      it("Q22 basic test 7 - string values", () => {
        expect(evalP(`(L32 ((dict (a "foo") (b "bar")) 'b))`))
          .to.deep.equal(makeOk("bar"));
      });
      
      it("Q22 basic test 8 - computed expressions as values", () => {
        expect(evalP(`(L32 ((dict (a (+ 1 1)) (b (* 2 3))) 'b))`))
          .to.deep.equal(makeOk(6));
      });
      
      it("Q22 basic test 9 - nested dict as value", () => {
        const r = evalP(`
          (L32
            ((dict (outer (dict (inner 99))) (other 0)) 'outer))
        `);
        expect(r).to.satisfy(isOk);
      });
      
      it("Q22 basic test 10 - parse-time failure on duplicate keys", () => {
        expect(evalP(`(L32 ((dict (a 1) (a 2)) 'a))`)).to.satisfy(isFailure);
      });
      
      it("Q22 basic test 11 - parse-time failure: key not identifier", () => {
        expect(evalP(`(L32 ((dict (1 2)) '1))`)).to.satisfy(isFailure);
      });
      
      it("Q22 basic test 12 - parse-time failure: no entries", () => {
        expect(evalP(`(L32 ((dict) 'a))`)).to.satisfy(isFailure);
      });
      
      it("Q22 basic test 13 - parse-time failure: malformed entry", () => {
        expect(evalP(`(L32 ((dict (a) (b 2)) 'b))`)).to.satisfy(isFailure);
      });
      
      it("Q22 basic test 14 - runtime failure: applying dict to non-symbol", () => {
        expect(evalP(`(L32 ((dict (a 1)) 123))`)).to.satisfy(isFailure);
      });
      
      it("Q22 basic test 15 - runtime failure: missing key lookup", () => {
        expect(evalP(`(L32 ((dict (a 1) (b 2)) 'c))`)).to.satisfy(isFailure);
      });
      
      it("Q22 basic test 16 - dict inside if-then-else", () => {
        expect(evalP(`
          (L32
            (define x 0)
            ((if (= x 0)
               (dict (a 10))
               (dict (a 20)))
             'a))
        `)).to.deep.equal(makeOk(10));
      });
      
      it("Q22 basic test 17 - dict as lambda argument", () => {
        expect(evalP(`
          (L32
            ((lambda (d) (d 'foo))
             (dict (foo 123) (bar 456))))
        `)).to.deep.equal(makeOk(123));
      });

      it("Q22 basic test 18 - nested dict special form supported", () => {
      const r = evalP(`
        (L32
          ((dict
            (outer (dict (inner 99)))
            (other 0))
          'outer))
      `);
      expect(r).to.satisfy((res: Result<Value>) =>
        isOk(res) && isDictValue(res.value)
      );
    });

    
    it("Q22 test 8 - empty dictionary application should fail", () => {
      expect(evalP(`(L32 ((dict) 'a))`)).to.deep.equal(
          makeFailure("Empty args for special form")
      );
  });

});