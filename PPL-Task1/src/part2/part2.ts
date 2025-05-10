import * as R from "ramda";

const stringToArray = R.split("");

/* Question 1 */
const vowels: string[] = ['a', 'e', 'i', 'o', 'u'];
export const countVowels: (s: string) => number = R.pipe(
    stringToArray,
    R.filter((c:string): boolean => vowels.includes(c.toLowerCase())),
    (strArr: string[]): number => strArr.length
);

/* Question 2 */
export const isPalindrome: (s: string) => boolean = R.pipe(
    stringToArray,
    R.filter((c:string): boolean => /[a-zA-Z0-9]/.test(c)),
    R.map((c:string): string => c.toLowerCase()),
    (strArr: string[]): boolean => 
        strArr.every((char: string,i: number): boolean => char === strArr[strArr.length - 1 - i])
);
  
/* Question 3 */
export type WordTree = {
    root: string;
    children: WordTree[];
}

export const treeToSentence: (tree:WordTree) => string = R.pipe(
    (tree:WordTree):string[] => [tree.root, ...R.map( (child:WordTree): string => treeToSentence(child), tree.children)],
    (childArr: string[]): string => childArr.join(" ")
);
    

