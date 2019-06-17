# Yaml to Go

Work in progress!

Create a go package from a given yaml file.

Caveats specifically for processing [Ethereum 2.0 yaml spec tests](https://github.com/ethereum/eth2.0-spec-tests):

- Hex strings are treated as bytes. You must handle hex encoded strings as
  binary data when serializing the yaml data.
- If a hex encoded byte string is 32, 48, or 96 bytes, then it will be a fixed
  size array. Otherwise the field is a byte slice.
- All number values are treated as unsigned 64 bit integers.

## Credits

Much of the original code was written in [mholt/json-to-go](https://github.com/mholt/json-to-go) (MIT).
