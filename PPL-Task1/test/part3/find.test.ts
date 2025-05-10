import * as R from "../../src/lib/result";
import * as F from "../../src/part3/find";

describe("Assignment 1 - Part 3", () => {
    describe("findResult", () => {
        it("returns a Failure when no element was found", () => {
            const my_list: string[] = ["dog", "cat", "rat"]

            expect(F.findResult(x => x.length > 3, my_list)).toSatisfy(R.isFailure);
        });

        it("returns an Ok when an element was found", () => {
            const my_list: string[] = ["raccoon", "ostrich", "slug"]
            expect(F.findResult(x => x.length > 3, my_list)).toSatisfy(R.isOk);
        });
        
        // Your tests here (optional)
        it("returns Ok of the first matching element only", () => {
            const my_list = ["hi", "hello", "hey", "hola"];
            const res = F.findResult(x => x.length >= 3, my_list);
            expect(res).toEqual(R.makeOk("hello")); // "hello" היא הראשונה באורך 5
        });
        
        it("returns Failure on empty array", () => {
            expect(F.findResult(x => x === "anything", [])).toSatisfy(R.isFailure);
        });
    });

    describe("returnSquaredIfFoundEven", () => {
        it("returns an Ok of the first even number squared in v2", () => {
            expect(F.returnSquaredIfFoundEven_v2([1, 2, 3])).toEqual(R.makeOk(4));
        });

        it("return a Failure if no even numbers are in the array in v2", () => {
            expect(F.returnSquaredIfFoundEven_v2([1, 3, 5])).toSatisfy(R.isFailure);
        });

        // Your tests here (optional)
        it("returns the first even number's square even if there are others", () => {
            expect(F.returnSquaredIfFoundEven_v2([1, 2, 4, 6])).toEqual(R.makeOk(4)); // רק הראשון
        });
        
        it("returns Failure on empty array in v2", () => {
            expect(F.returnSquaredIfFoundEven_v2([])).toSatisfy(R.isFailure);
        });

        // v3
        it("returns the square of the first even number in v3", () => {
            expect(F.returnSquaredIfFoundEven_v3([1, 6, 8])).toEqual(36);
        });
    
        it("returns -1 if no even number is found in v3", () => {
            expect(F.returnSquaredIfFoundEven_v3([1, 3, 5])).toEqual(-1);
        });
    
        it("returns square of first negative even number in v3", () => {
            expect(F.returnSquaredIfFoundEven_v3([-2, 1, 5])).toEqual(4);
        });
    });
});