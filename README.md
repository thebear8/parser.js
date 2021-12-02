# parser.js

A library for building recusive descent parsers by hand, 
Inspired by [dmaevsky/rd-parse](https://github.com/dmaevsky/rd-parse).

## Functionality
- Automatic AST Generation
- Grammar is written directly in JS using EBNF/Regex-like operators

## Remarks
- This library makes use of [rest parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters) quite extensively to make usage more convenient
- If a match was found the matched values are returned in an array, empty arrays `[]` indicate success but no matched values
- If no match was found or the match failed `undefined` is returned

## Basic Tokens
### CapturingString
```javascript
CapturingString(value)
```
- Matches a given string at the current position
- Captures the matched string
- Returns an the matched string in an array or `undefined` on failure

### NonCapturingString
```javascript
NonCapturingString(value)
```
- Matches a given string at the current position
- Does not capture anything
- Returns an empty array `[]` or `undefined` on failure

### Regex
```javascript
Regex(value)
```
- Matches a given regex at the current position
- Captures all capturing groups of the regex
- Returns the capturing groups in an array or `undefined` on failure

## Operators/Combinators
### All ( `,` )
```javascript
All(...fragments)
```
- Concatenates the given fragments
- Matches the concatenated fragments exactly 1 time
- Returns matched values in an array or `undefined` on failure

### Any ( `|` )
```javascript
Any(...fragments)
```
- Tries all fragments until a matching one is found
- Matches the first matching fragment exactly once
- Returns the first match found in an array or `undefined` on failure

### Optional ( `?` )
```javascript
Optional(...fragments)
```
- Concatenates the given fragments
- Matches the concatenated fragments 0 to 1 times
- Returns matched values in an array or an empty array `[]` when no match was found

### Repetition ( `*` )
```javascript
Repetition(...fragments)
```
- Concatenates the given fragments
- Matches the concatenated fragments 0 to unlimited times
- Return matched values in an array or empty array `[]` when no match was found

### AtleastOnce ( `+` )
```javascript
AtleastOnce(...fragments)
```
- Concatenates the given fragments
- Matches the concatenated fragments 1 to unlimited times
- Return matched values in an array or `undefined` on failure

## Modifiers
### Group
```javascript
Group(...fragments)
```
- Concatenates the given fragments
- Returns the matched values as an array __inside__ an array

### Reduce
```javascript
Reduce(reduce, ...fragments)
```
- Concatenates the given fragments
- Calls the `reduce` function with matched values as arguments
- If `Array.isArray(returnValue)` is true, returns the return value as is
- If `Array.isArray(returnValue)` is false, returns the return value in an array
- On failure, returns `undefined`

### AstNode
```javascript
AstNode(constructor, ...fragments)
```
- Concatenates the given fragments
- Instantiates a new object from the given constructor with the matched values as arguments
- Returns the instantiated value in an array or `undefined` on failure

### Whitespace
```javascript
Whitespace(whitespace, ...fragments)
```
- Concatenates the given fragments
- Sets the current whitespace fragment for all descending fragments
- returns the matched values in an array or `undefined` on failure