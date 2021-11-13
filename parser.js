////////////////////////////////////////////////////////////////
// ATOMIC TOKENS
////////////////////////////////////////////////////////////////

export function Regex(value) {
    value = value.source ?? value;
    value = value.startsWith("^") ? value : "^" + value;
    let regex = new RegExp(value);
    return wrapRule((ctx) => {
        let match = regex.exec(ctx.input.substr(ctx.position));
        if(match) {
            ctx.advance(match[0].length);
            return match.slice(1);
        } else {
            return undefined;
        }
    });
};

export function String(value) {
    return wrapRule((ctx) => {
        if(ctx.input.startsWith(value, ctx.position)) {
            ctx.advance(value.length);
            return [];
        } else {
            return undefined;
        }
    });
};

////////////////////////////////////////////////////////////////
// OPERATORS
////////////////////////////////////////////////////////////////

export function All(...rules) {
    rules = rules.map(makeRule);
    return wrapRule((ctx) => {
        let values = [];
        for(let rule of rules) {
            let value = rule(ctx);
            if(value) {
                values.push(...value);
            } else {
                return undefined;
            }
        }
        return values;
    });
};

export function Any(...rules) {
    rules = rules.map(makeRule);
    return wrapRule((ctx) => {
        for(let rule of rules) {
            ctx.save();
            let value = rule(ctx);
            if(value) {
                ctx.discard();
                return value;
            } else {
                ctx.restore();
            }
        }
        return undefined;
    });
};

export function Optional(...rules) {
    let rule = All(...rules.map(makeRule));
    return wrapRule((ctx) => {
        let value = rule(ctx);
        if(value) {
            return value;
        } else {
            return [];
        }
    });
};

export function Repetition(...rules) {
    let rule = All(...rules.map(makeRule));
    return wrapRule((ctx) => {
        let values = [];
        while(true) {
            let value = rule(ctx);
            if(value) {
                values.push(...value);
            } else {
                return values;
            }
        }
    });
};

export function AtleastOnce(...rules) {
    let rule = All(...rules.map(makeRule));
    return wrapRule((ctx) => {
        let values = undefined;
        while(true) {
            let value = rule(ctx);
            if(value) {
                values ??= [];
                values.push(...value);
            } else {
                return values;
            }
        }
    });
};

////////////////////////////////////////////////////////////////
// MODIFIERS
////////////////////////////////////////////////////////////////

export function Reduce(reduce, ...rules) {
    let rule = All(...rules.map(makeRule));
    return wrapRule((ctx) => {
        let value = rule(ctx);
        if(value) {
            let reduced = reduce(value);
            reduced.from = value.from;
            reduced.to = value.to;
            if(!Array.isArray(reduced)) {
                return [reduced];
            } else {
                return reduced;
            }
        } else {
            return undefined;
        }
    });
};

export function Whitespace(whitespace, ...rules) {
    whitespace = makeRule(whitespace);
    let rule = All(...rules.map(makeRule));
    return wrapRule((ctx) => {
        let prevWhitespace = ctx.whitespace;
        ctx.whitespace = whitespace;
        let value = rule(ctx);
        ctx.whitespace = prevWhitespace;
        return value;
    });
};

export function Action(action) {
    return wrapRule(action);
};

////////////////////////////////////////////////////////////////
// Y COMBINATOR
////////////////////////////////////////////////////////////////

export function Y(proc) {
    return function(x) {
        return proc(function(y) {
            return (x(x))(y);
        });
    }(function(x) {
        return proc(function(y) {
            return (x(x))(y);
        });
    });
};

////////////////////////////////////////////////////////////////
// HELPERS
////////////////////////////////////////////////////////////////

function makeRule(rule) {
    if (typeof (rule) == "function") return rule;
    if (typeof (rule) == "string") return new String(rule);
    if (rule instanceof RegExp) return new Regex(rule);
};

function makeContext(input) {
    if (input.constructor == Context) return input;
    else return new Context(input);
};

function wrapRule(rule) {
    return function(input) {
        let ctx = makeContext(input);
        ctx.save();
        ctx.skipWhitespace();
        let from = ctx.position;
        let value = rule(ctx);
        let to = ctx.position;
        if(value) {
            ctx.discard();
            value.from = from;
            value.to = to;
            return value;
        } else {
            ctx.restore();
            return undefined;
        }
    };
};

function Context(input) {
    this.input = input;
    this.position = 0;
    this.positionStack = [];
    this.whitespace = (() => undefined);

    this.advance = (count) => this.position += count;

    this.save = () => this.positionStack.push(this.position);
    this.discard = () => this.positionStack.pop();
    this.restore = () => this.position = this.positionStack.pop();

    this.skipWhitespace = () => {
        let whitespace = this.whitespace;
        this.whitespace = (() => undefined);
        while(whitespace(this)) {};
        this.whitespace = whitespace;
    };
};