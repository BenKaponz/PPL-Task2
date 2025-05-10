import { countVowels, isPalindrome, treeToSentence, WordTree } from "../../src/part2/part2";

describe("Assignment 1 - Part 2", () => {

    describe("countVowels", () => {

        it("should count vowels in a simple word", () => {
            expect(countVowels("hello")).toBe(2);
        });

        it("should count vowels in uppercase and lowercase", () => {
            expect(countVowels("HELLO")).toBe(2);
        });

        // Your tests here (optional)
        it("should return 0 for a string with no vowels", () => {
            expect(countVowels("rhythm")).toBe(0);
        });
        
        it("should count all vowels in a long sentence", () => {
            expect(countVowels("The quick brown fox jumps over the lazy dog")).toBe(11);
        });
        
        it("should ignore non-letter characters", () => {
            expect(countVowels("123!@#aei")).toBe(3);
        });
        
        it("should return 0 for an empty string", () => {
            expect(countVowels("")).toBe(0);
        });
        
        it("should handle repeated vowels", () => {
            expect(countVowels("aaeeii")).toBe(6);
        });
    });

    describe("isPalindrome", () => {

        it("should return true for a simple palindrome", () => {
            expect(isPalindrome("racecar")).toBe(true);
        });

        it("should return true for a palindrome with mixed case", () => {
            expect(isPalindrome("RaceCar")).toBe(true);
        });

        // Your tests here (optional)
        it("should return false for a non-palindrome", () => {
            expect(isPalindrome("hello")).toBe(false);
        });
        
        it("should ignore case", () => {
            expect(isPalindrome("MadAm")).toBe(true);
        });
        
        it("should return true for a single letter", () => {
            expect(isPalindrome("a")).toBe(true);
        });
        
        it("should return true for an empty string", () => {
            expect(isPalindrome("")).toBe(true); // לפעמים זה נחשב לפאלינדרום תקף
        });
        
        it("should ignore spaces, punctuation, and capitalization", () => {
            expect(isPalindrome("A man, a plan, a canal, Panama!")).toBe(true);
        });
        
    });

    describe("treeToSentence", () => {

        it("should concatenate words in pre-order traversal", () => {
            const tree: WordTree = {
                root: "Hello",
                children: [
                    { root: "from", children: [] },
                    { root: "PPL", children: [] },
                    { root: "team!", children: [] },
                ],
            };

            expect(treeToSentence(tree)).toBe("Hello from PPL team!");
        });

        it("should handle deeper nesting", () => {
            const tree: WordTree = {
                root: "Hello",
                children: [
                    {
                        root: "students",
                        children: [{ root: "how", children: [] }],
                    },
                    { root: "are", children: [] },
                    { root: "you?", children: [] },
                ],
            };

            expect(treeToSentence(tree)).toBe("Hello students how are you?");
        });

        // Your tests here (optional)
        it("should handle nested children recursively", () => {
            const tree: WordTree = {
                root: "This",
                children: [
                    {
                        root: "is",
                        children: [
                            {
                                root: "a",
                                children: [
                                    {
                                        root: "deep",
                                        children: [
                                            { root: "tree", children: [] }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };
        
            expect(treeToSentence(tree)).toBe("This is a deep tree");
        });

    });

});
