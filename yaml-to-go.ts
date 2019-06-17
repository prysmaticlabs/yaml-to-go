import YAML from 'yaml';

export function yamlToGo(input: string, typename = "AutoGenerated", flatten = true) {
  let data;
  let scope;
  let go = "";
  let tabs = 0;

  const seen: any = {};
  const stack: any[] = [];
  let accumulator = "";
  let innerTabs = 0;
  let parent = "";

  try {
    data = YAML.parse(input.replace(/\.0/g, ".1")); // hack that forces floats to stay as floats
    scope = data;
  } catch (e) {
    return {
      go: "",
      error: e.message
    };
  }

  typename = format(typename);
  append(`type ${typename} `);

  parseScope(scope);

  return {
    go: flatten ? (go += accumulator) : go
  };

  function parseScope(scope: any, depth = 0) {
    if (typeof scope === "object" && scope !== null) {
      if (Array.isArray(scope)) {
        let sliceType;
        const scopeLength = scope.length;

        for (let i = 0; i < scopeLength; i++) {
          const thisType = goType(scope[i]);
          if (!sliceType) sliceType = thisType;
          else if (sliceType != thisType) {
            sliceType = mostSpecificPossibleGoType(thisType, sliceType);
            if (sliceType == "interface{}") break;
          }
        }

        const slice =
          flatten && ["struct", "slice"].includes(sliceType || '')
            ? `[]${parent}`
            : `[]`;

        if (flatten && depth >= 2) appender(slice);
        else append(slice);
        if (sliceType == "struct") {
          const allFields: any = {};

          // for each field counts how many times appears
          for (let i = 0; i < scopeLength; i++) {
            const keys = Object.keys(scope[i]);
            for (let k in keys) {
              let keyname = keys[k];
              if (!(keyname in allFields)) {
                allFields[keyname] = {
                  value: scope[i][keyname],
                  count: 0
                };
              } else {
                const existingValue = allFields[keyname].value;
                const currentValue = scope[i][keyname];

                if (compareObjects(existingValue, currentValue)) {
                  const comparisonResult = compareObjectKeys(
                    Object.keys(currentValue),
                    Object.keys(existingValue)
                  );
                  if (!comparisonResult) {
                    keyname = `${keyname}_${uuidv4()}`;
                    allFields[keyname] = {
                      value: currentValue,
                      count: 0
                    };
                  }
                }
              }
              allFields[keyname].count++;
            }
          }

          // create a common struct with all fields found in the current array
          // omitempty dict indicates if a field is optional
          const keys = Object.keys(allFields);
          const struct: any = {};
          const omitempty: any = {};

          for (let k in keys) {
            const keyname = keys[k],
              elem = allFields[keyname];

            struct[keyname] = elem.value;
            omitempty[keyname] = elem.count != scopeLength;
          }
          parseStruct(depth + 1, innerTabs, struct, omitempty); // finally parse the struct !!
        } else if (sliceType == "slice") {
          parseScope(scope[0], depth);
        } else {
          if (flatten && depth >= 2) {
            appender(sliceType || "interface{}");
          } else {
            append(sliceType || "interface{}");
          }
        }
      } else {
        if (flatten) {
          if (depth >= 2) {
            appender(parent);
          } else {
            append(parent);
          }
        }
        parseStruct(depth + 1, innerTabs, scope);
      }
    } else {
      if (flatten && depth >= 2) {
        appender(goType(scope));
      } else {
        append(goType(scope));
      }
    }
  }

  function parseStruct(depth: number, innerTabs: number, scope: any, omitempty?: any) {
    if (flatten) {
      stack.push(depth >= 2 ? "\n" : "");
    }

    if (flatten && depth >= 2) {
      const parentType = `type ${parent}`;
      const scopeKeys = formatScopeKeys(Object.keys(scope));

      // this can only handle two duplicate items
      // future improvement will handle the case where there could
      // three or more duplicate keys with different values
      if (parent in seen && compareObjectKeys(scopeKeys, seen[parent])) {
        stack.pop();
        return;
      }
      seen[parent] = scopeKeys;

      appender(`${parentType} struct {\n`);
      ++innerTabs;
      const keys = Object.keys(scope);
      for (let i in keys) {
        const keyname = getOriginalName(keys[i]);
        indenter(innerTabs);
        const typename = format(keyname);
        appender(typename + " ");
        parent = typename;
        parseScope(scope[keys[i]], depth);
        appender(' `yaml:"' + keyname);
        if (omitempty && omitempty[keys[i]] === true) {
          appender(",omitempty");
        }
        appender('"`\n');
      }
      indenter(--innerTabs);
      appender("}");
    } else {
      append("struct {\n");
      ++tabs;
      const keys = Object.keys(scope);
      for (let i in keys) {
        const keyname = getOriginalName(keys[i]);
        indent(tabs);
        const typename = format(keyname);
        append(typename + " ");
        parent = typename;
        parseScope(scope[keys[i]], depth);
        append(' `yaml:"' + keyname);
        if (omitempty && omitempty[keys[i]] === true) {
          append(",omitempty");
        }
        append('"`\n');
      }
      indent(--tabs);
      append("}");
    }
    if (flatten) accumulator += stack.pop();
  }

  function indent(tabs: number) {
    for (let i = 0; i < tabs; i++) go += "\t";
  }

  function append(str: string) {
    go += str;
  }

  function indenter(tabs: number) {
    for (let i = 0; i < tabs; i++) stack[stack.length - 1] += "\t";
  }

  function appender(str: string) {
    stack[stack.length - 1] += str;
  }

  // Sanitizes and formats a string to make an appropriate identifier in Go
  function format(str: string): string {
    if (!str) return "";
    else if (str.match(/^\d+$/)) str = "Num" + str;
    else if (str.charAt(0).match(/\d/)) {
      const numbers: any = {
        "0": "Zero_",
        "1": "One_",
        "2": "Two_",
        "3": "Three_",
        "4": "Four_",
        "5": "Five_",
        "6": "Six_",
        "7": "Seven_",
        "8": "Eight_",
        "9": "Nine_"
      };
      str = numbers[str.charAt(0)] + str.substr(1);
    }
    return toProperCase(str).replace(/[^a-z0-9]/gi, "") || "NAMING_FAILED";
  }

  // Determines the most appropriate Go type
  function goType(val: any) {
    if (val === null) return "interface{}";

    switch (typeof val) {
      case "string":
        const newSlice = val.slice(2,);
        const newLen = newSlice.length/2;
        if (newLen == 32 || newLen == 48 || newLen == 96) {
        }

        if (/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(\+\d\d:\d\d|Z)/.test(val))
          return "time.Time";
        else if (val.startsWith('0x')) 
          return "[]byte";
        else return "string";
      case "number":
        if (val % 1 === 0) {
          return "uint64";
        } else return "float64";
      case "boolean":
        return "bool";
      case "object":
        if (Array.isArray(val)) return "slice";
        return "struct";
      default:
        return "interface{}";
    }
  }

  // Given two types, returns the more specific of the two
  function mostSpecificPossibleGoType(typ1: string, typ2: string): string {
    if (typ1.substr(0, 5) == "float" && typ2.substr(0, 3) == "int") return typ1;
    else if (typ1.substr(0, 3) == "int" && typ2.substr(0, 5) == "float")
      return typ2;
    else return "interface{}";
  }

  // Proper cases a string according to Go conventions
  function toProperCase(str: string) {
    // https://github.com/golang/lint/blob/5614ed5bae6fb75893070bdc0996a68765fdd275/lint.go#L771-L810
    const commonInitialisms = [
      "ACL",
      "API",
      "ASCII",
      "CPU",
      "CSS",
      "DNS",
      "EOF",
      "GUID",
      "HTML",
      "HTTP",
      "HTTPS",
      "ID",
      "IP",
      "JSON",
      "LHS",
      "QPS",
      "RAM",
      "RHS",
      "RPC",
      "SLA",
      "SMTP",
      "SQL",
      "SSH",
      "TCP",
      "TLS",
      "TTL",
      "UDP",
      "UI",
      "UID",
      "UUID",
      "URI",
      "URL",
      "UTF8",
      "VM",
      "XML",
      "XMPP",
      "XSRF",
      "XSS"
    ];

    return str
      .replace(/(^|[^a-zA-Z])([a-z]+)/g, function(unused:string, sep:string, frag:string) {
        if (commonInitialisms.indexOf(frag.toUpperCase()) >= 0)
          return sep + frag.toUpperCase();
        else return sep + frag[0].toUpperCase() + frag.substr(1).toLowerCase();
      })
      .replace(/([A-Z])([a-z]+)/g, function(unused:string, sep:string, frag:string) {
        if (commonInitialisms.indexOf(sep + frag.toUpperCase()) >= 0)
          return (sep + frag).toUpperCase();
        else return sep + frag;
      });
  }

  function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      var r = (Math.random() * 16) | 0,
        v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getOriginalName(unique: string) {
    const reLiteralUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const uuidLength = 36;

    if (unique.length >= uuidLength) {
      const tail = unique.substr(-uuidLength);
      if (reLiteralUUID.test(tail)) {
        return unique.slice(0, -1 * (uuidLength + 1));
      }
    }
    return unique;
  }

  function compareObjects(objectA: Object, objectB: Object) {
    const objectStr = "[object Object]";
    return (
      Object.prototype.toString.call(objectA) === objectStr &&
      Object.prototype.toString.call(objectB) === objectStr
    );
  }

  function compareObjectKeys(itemAKeys: Array<string>, itemBKeys: Array<string>) {
    const lengthA = itemAKeys.length;
    const lengthB = itemBKeys.length;

    // nothing to compare, probably identical
    if (lengthA == 0 && lengthB == 0) return true;

    // duh
    if (lengthA != lengthB) return false;

    for (let item of itemAKeys) {
      if (!itemBKeys.includes(item)) return false;
    }
    return true;
  }

  function formatScopeKeys(keys: string[]) {
    return keys.map(format)
  }
}
