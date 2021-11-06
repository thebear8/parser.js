export function Regex(rule) {
    rule = rule.source ?? rule;
    rule = rule.startsWith("^") ? rule : "^" + rule;
    let regex = new RegExp(rule);
    return function(ctx) {
        ctx = Context(ctx);
        ctx.skipIgnored();
        let match = regex.exec(ctx.input.substr(ctx.position));
        if(match) {
            ctx.advance(match[0].length);
            return match.slice(1);
        } else {
            return undefined;
        }
    };
};

export function String(rule) {
    return function(ctx) {
        ctx = Context(ctx);
        ctx.skipIgnored();
        if(ctx.input.startsWith(rule, ctx.position)) {
            ctx.advance(rule.length);
            return [];
        } else {
            return undefined;
        }
    };
};

export function Concatenation(...rules) {
    rules = rules.map(Rule);
    return function(ctx) {
        ctx = Context(ctx);
        ctx.save();
        let values = [];
        for(let rule of rules) {
            let value = rule(ctx);
            if(!value) {
                ctx.restore();
                return undefined;
            } else {
                values.push(...value);
            }
        }
        ctx.discard();
        return values;
    };
};

export function Alternation(...rules) {
    rules = rules.map(Rule);
    return function(ctx) {
        ctx = Context(ctx);
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
    };
};

export function Optional(...rules) {
    rules = rules.map(Rule);
    let rule = Concatenation(...rules);
    return function(ctx) {
        ctx = Context(ctx);
        ctx.save();
        let value = rule(ctx);
        if(value) {
            ctx.discard();
            return value;
        } else {
            ctx.restore();
            return [];
        }
    };
};

export function Repetition(...rules) {
    rules = rules.map(Rule);
    let rule = Concatenation(...rules);
    return function(ctx) {
        ctx = Context(ctx);
        ctx.save();
        let values = [];
        while(true) {
            let value = rule(ctx);
            if(value) {
                values.push(...value);
            } else {
                ctx.discard();
                return values;
            }
        }
    };
};

export function AtleastOnce(...rules) {
    rules = rules.map(Rule);
    let rule = Concatenation(...rules);
    return function(ctx) {
        ctx = Context(ctx);
        ctx.save();
        let values = undefined;
        while(true) {
            let value = rule(ctx);
            if(value) {
                values ??= [];
                values.push(...value);
            } else {
                ctx.discard();
                return values;
            }
        }
    };
};

export function Reduce(reduce, ...rules) {
    rules = rules.map(Rule);
    let rule = Concatenation(...rules);
    return function(ctx) {
        ctx = Context(ctx);
        let value = rule(ctx);
        if(value) {
            return reduce(value);
        } else {
            return undefined;
        }
    };
};

export function Ignore(ignore, ...rules) {
    ignore = Rule(ignore);
    rules = rules.map(Rule);
    let rule = Concatenation(...rules);
    return function(ctx) {
        ctx = Context(ctx);
        ctx.ignoredStack.push(ignore);
        let value = rule(ctx);
        ctx.ignoredStack.pop();
        return value;
    };
};

export function Action(action) {
    return function(ctx) {
        ctx = Context(ctx);
        ctx.save();
        ctx.skipIgnored();
        let result = action(ctx);
        if(result) {
            ctx.discard();
            return result;
        } else {
            ctx.restore();
            return undefined;
        }
    };
}

////////////////////////////////////////////////////////////////

export function Y(rule) {
    return function(f) {
        return f(f);
    }(function(f) {
        return rule(function(x) {
            return (f(f))(x);
        });
    });
};

export function Rule(rule) {
    if(typeof(rule) == "function") return rule;
    if(typeof(rule) == "string") return new String(rule);
    if(rule instanceof RegExp) return new Regex(rule);
};

export function Context(input) {
    if(input.constructor == Input) return input;
    if(!this) return new Context(input);

    this.input = input;
    this.position = position;
    this.positionStack = [];
    this.ignoredStack = [];

    this.advance = (count) => this.position += count;

    this.save = () => this.positionStack.push(this.position);
    this.discard = () => this.positionStack.pop();
    this.restore = () => this.position = this.positionStack.pop();

    this.skipIgnored = () => {
        let skipIgnored = this.skipIgnored;
        this.skipIgnored = () => { };

        this.ignoredStack.forEach((rule) => {
            if(rule(this)) {
                this.skipIgnored = skipIgnored;
                return this.skipIgnored();
            }
        });

        this.skipIgnored = skipIgnored;
        return undefined;
    };
};