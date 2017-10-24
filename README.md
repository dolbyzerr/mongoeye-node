## Basic nodejs binding for [mongoeye](https://github.com/mongoeye/mongoeye)

### Installation

```
npm install mongoeye
```

### Usage

```
mongoeye({
  host: 'localhost',
  db: 'test',
  col: 'user',
  format: 'json'
})
.then(result => console.log(result))
.catch(err => console.error(err))
```

Module basically supports all [flags](https://github.com/mongoeye/mongoeye#list-of-flags)

If `format: json` option is provided then result will be automatically parsed to JSON
