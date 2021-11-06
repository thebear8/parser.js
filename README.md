# parser.js

A library for building recusive descent parsers by hand, 
Inspired by [dmaevsky/rd-parse](https://github.com/dmaevsky/rd-parse).

### Functionality
- Automatic AST Generation
- Grammar is written directly in JS using EBNF/Regex-like operators

### Basic Tokens
- String: Matches a given string at the current position
- Regex: Matches a given regex at the current position

### Operators
- All (  `,` )
- Any ( `|` )
- Optional ( `?` )
- Repeat ( `*` )
- AtleastOnce ( `+` )

### Modifiers
- Reduce: Reduce matched fragments using the given callback
- Ignore: Push the given token onto the ignore stack
- Action: Match using the given callback

### Usage
```javascript
const Expression = Any(BoolLiteral, IntLiteral, FloatLiteral, StringLiteral);
const Assignment = All("let", /[a-zA-Z$_][a-zA-Z0-9$_]*/, "=", Expression);
```

- All Rules/Reduce callbacks return matched fragments as an array `[]` or `undefined` on failure
- If given multiple rules as rest arguments, `Optional`, `Repeat`, `AtleastOnce`, `Reduce`, `Ignore` will automatically concatenate them into one rule