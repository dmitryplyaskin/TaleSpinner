start
  = nodes:template_nodes { return { kind: "template_raw", nodes }; }

template_nodes
  = nodes:(if_block / each_block / output_tag / text)* { return nodes; }

text
  = value:$((!"{{" .)+) {
      return { kind: "text", value };
    }

output_tag
  = "{{" _ source:tag_source? _ "}}" {
      return { kind: "raw_output", source: (source ?? "").trim() };
    }

if_block
  = "{{" _ "#if" __ condition:tag_source? _ "}}"
    then_nodes:if_body
    else_nodes:if_else?
    "{{" _ "/if" _ "}}" {
      return {
        kind: "raw_if",
        condition: (condition ?? "").trim(),
        then: then_nodes,
        else: else_nodes ?? [],
      };
    }

if_body
  = nodes:(!("{{else" / "{{ else" / "{{/if" / "{{ /if") node:(if_block / each_block / output_tag / text) { return node; })* {
      return nodes;
    }

if_else
  = "{{" _ "else" _ "}}" nodes:(!("{{/if" / "{{ /if") node:(if_block / each_block / output_tag / text) { return node; })* {
      return nodes;
    }

each_block
  = "{{" _ "#each" __ source:tag_source? _ "}}"
    body:each_body
    "{{" _ "/each" _ "}}" {
      return {
        kind: "raw_each",
        source: (source ?? "").trim(),
        body,
      };
    }

each_body
  = nodes:(!("{{/each" / "{{ /each") node:(if_block / each_block / output_tag / text) { return node; })* {
      return nodes;
    }

tag_source
  = value:$((!"}}" .)+) { return value; }

_ = [ \t\r\n]*
__ = [ \t\r\n]+
