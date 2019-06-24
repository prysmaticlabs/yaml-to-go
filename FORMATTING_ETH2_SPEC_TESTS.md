# Formatting ETH 2.0 spec tests.

Here's the script to run to generate a formatted tar of the eth2.0 yaml tests.

```
# Run this from within the yaml-to-go repo.

git clone git@github.com:prysmaticlabs/eth2.0-spec-tests.git
cd eth2.0-spec-tests
git lfs checkout
rm -rf /tmp/eth2.0-spec-tests
find tests -type d -exec mkdir -p /tmp/eth2.0-spec-tests/{} \;
cd ..
bazel build //yaml-hex-to-base64:yaml-hex-to-base64
find eth2.0-spec-tests/**/*.yaml | xargs -L1 -t -I {} sh -c 'dist/bin/yaml-hex-to-base64/yaml-hex-to-base64 $1 > /tmp/$1' -- {}
cd /tmp/eth2.0-spec-tests
tar czvf base64_encoded_archive.tar.gz **/*.yaml
```
