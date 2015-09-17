# slush-lambda

> Generates a aws-lambda node project


## Getting Started

Install `slush-lambda` globally:

```bash
$ npm install -g slush-lambda
```

### Usage

Create a new folder for your project:

```bash
$ mkdir my-slush-lambda
```

Run the generator from within the new folder:

```bash
$ cd my-slush-lambda && slush lambda
```

## Getting To Know Slush

Slush is a tool that uses Gulp for project scaffolding.

Slush does not contain anything "out of the box", except the ability to locate installed slush generators and to run them with liftoff.

To find out more about Slush, check out the [documentation](https://github.com/slushjs/slush).

## Contributing

### Versioning

When you make a change in your feature/fix branch make sure you update the version for the package.
```bash
$ npm version [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease]
```

Example:
If you made a patch
```bash
$ npm version patch
```

The above command will automatically create a git tag for the repository
When doing a git push, specify the tag-name to push the tag information to the repo

Ex.
```bash
$ git push origin/branchname tagname
```


## Support
If you have any problem or suggestion please open an issue [here](https://github.com/LoyaltyOne/slush-lambda/issues).

## License 

The MIT License

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

