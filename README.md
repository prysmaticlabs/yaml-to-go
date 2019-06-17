# Yaml to Go

Work in progress!

Create a go package from a given yaml file.

Caveats specifically for processing [Ethereum 2.0 yaml spec tests](https://github.com/ethereum/eth2.0-spec-tests):

- Hex strings are treated as bytes. You must handle hex encoded strings as
  binary data when serializing the yaml data.
- When hex strings are considered for their type, if the length of the bytes
  is less than or equal to 96 then it will be a fixed sized byte array. 
  Otherwise, it is considered a byte slice `[]byte`.

## Credits

Much of the original code was written in [mholt/json-to-go](https://github.com/mholt/json-to-go) (MIT).
