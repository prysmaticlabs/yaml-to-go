# Yaml to Go

Create a go package from a given yaml file.

Caveats specifically for processing [Ethereum 2.0 yaml spec tests](https://github.com/ethereum/eth2.0-spec-tests):

- Hex strings are treated as bytes. You must handle hex encoded strings as
  binary data when serializing the yaml data.
- If a hex encoded byte string is 32, 48, or 96 bytes, then ssz tag is added
  to the struct. Example: `ssz:"size=32"` 
- All number values are treated as unsigned 64 bit integers, unless it is a
  decimal number then it would be float64.
- This library actually adds `json` tags to the structs because that seems to
  be the only way it works with [github.com/ghodss/yaml](github.com/ghodss/yaml)


Note: This project is not unit tested or held to any high code standards. 
It exists purely due to the nuances in eth2 spec tests where existing code
generation and yaml processing would not work. In other words, it's bad! 

## Credits

Much of the original code was written in [mholt/json-to-go](https://github.com/mholt/json-to-go) (MIT).
