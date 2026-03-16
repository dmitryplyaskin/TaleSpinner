{
  function binary(op, left, right) {
    return { kind: "binary", op, left, right };
  }
}

start
  = _ expr:or_expr _ { return expr; }

or_expr
  = head:and_expr tail:(_ "or" __ right:and_expr { return right; })* {
      return tail.reduce((left, right) => binary("or", left, right), head);
    }

and_expr
  = head:equality_expr tail:(_ "and" __ right:equality_expr { return right; })* {
      return tail.reduce((left, right) => binary("and", left, right), head);
    }

equality_expr
  = head:unary_expr tail:(_ op:("==" / "!=") _ right:unary_expr { return { op, right }; })* {
      return tail.reduce(
        (left, item) => binary(item.op === "==" ? "eq" : "neq", left, item.right),
        head
      );
    }

unary_expr
  = "not" __ value:unary_expr { return { kind: "unary", op: "not", value }; }
  / primary

primary
  = call
  / literal
  / array
  / object
  / path
  / "(" _ expr:or_expr _ ")" { return expr; }

call
  = name:identifier _ "(" _ args:arg_list? _ ")" {
      return { kind: "call", name, args: args ?? [] };
    }

arg_list
  = head:or_expr tail:(_ "," _ value:or_expr { return value; })* {
      return [head, ...tail];
    }

path
  = head:identifier tail:(_ "." _ segment:identifier { return segment; })* {
      return { kind: "path", segments: [head, ...tail] };
    }

array
  = "[" _ items:arg_list? _ "]" {
      return { kind: "array", items: items ?? [] };
    }

object
  = "{" _ entries:object_entries? _ "}" {
      return { kind: "object", entries: entries ?? [] };
    }

object_entries
  = head:object_entry tail:(_ "," _ entry:object_entry { return entry; })* {
      return [head, ...tail];
    }

object_entry
  = key:(identifier / string_literal) _ ":" _ value:or_expr {
      return { key, value };
    }

literal
  = null_literal
  / boolean_literal
  / number_literal
  / string_literal_node

null_literal
  = "null" { return { kind: "literal", value: null }; }

boolean_literal
  = "true" { return { kind: "literal", value: true }; }
  / "false" { return { kind: "literal", value: false }; }

number_literal
  = value:$("-"? [0-9]+ ("." [0-9]+)?) {
      return { kind: "literal", value: Number(value) };
    }

string_literal_node
  = value:string_literal { return { kind: "literal", value }; }

string_literal
  = '"' chars:double_char* '"' { return chars.join(""); }
  / "'" chars:single_char* "'" { return chars.join(""); }

double_char
  = "\\n" { return "\n"; }
  / "\\r" { return "\r"; }
  / "\\t" { return "\t"; }
  / '\\"' { return '"'; }
  / "\\\\" { return "\\"; }
  / !'"' char:. { return char; }

single_char
  = "\\n" { return "\n"; }
  / "\\r" { return "\r"; }
  / "\\t" { return "\t"; }
  / "\\'" { return "'"; }
  / "\\\\" { return "\\"; }
  / !"'" char:. { return char; }

identifier
  = $([a-zA-Z_] [a-zA-Z0-9_]*)

_ = [ \t\r\n]*
__ = [ \t\r\n]+
