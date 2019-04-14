## Summary

The problem:  
We want to auto-generate .js groups of files [1] that covers all the possible combinations given a phrase.

**[1]** a group is a prompt folder with a commonScript, variant and variant-inputs inside.

For example:
I want to eat {apples} that cost {1000} dolars between {10 am} and {8pm} and that would make me {happy}.

**words between {} represents dynamic content.**

[apples, 1000] are **required** fields, that means, we can assume they will always exist and shouldn't be considered in the combinatory.
 
[10am, 8pm, happy] are **optional** fields, that means, they could or not be present, so their uncerintability will generate different files.

* assume we have a *Replace* function available like: 
```
Replace(text, ...words)
```
* assume the *script file* will consume a *params* object that holds the data.
* assume the result must be set in a global *output* object using its *addText* method like:
```
output.addText(result)
```
* assume params global object must be checked after being used, like:
```
if (typeof params !== 'undefined') {
    var data = params.foo;
}
```
* assume file-{n}-definitions.js and file-{n}-script.js will be merged so you can access any variables declared in one from the other.
* assume dates should be *REPLACED* with another function called *ReplaceDate* like: 
```
ReplaceDate(text, date);
```
* assume *Replace* and *ReplaceDate* are methods of the *TextFormat* object, like:
```
TextFormat.Replace(text, ...words);
TextFormat.ReplaceDate(text, date);
```
* assume *params* fields can be objects, like:
```
var apple = params.tree.leafs.apple;
var result = TextFormat.Replace(text, ..., apple, ...);
output.addText(result);
```

Expected result:

**Group 1**

{file-1-definitions}.js ->
```
var text = "I want to eat {0} that cost {1} dolars between {2} and {3} and that would make me {4}.";
```
{file-1-script}.js ->
```
if (typeof params !== 'undefined') {
    return;
}

var result = TextFormat.Replace(text, params.food, params.cost, params.initialDate, params.endDate, params.emotion);

output.addText(result);
```

**Group 2**

{file-2-definitions}.js ->
```
var text = "I want to eat {0} that cost {1} dolars at {2} and that would make me {3}.";
```
{file-2-script}.js ->
```
if (typeof params !== 'undefined') {
    return;
}

var result = TextFormat.Replace(text, params.food, params.cost, params.initialDate, params.emotion);

output.addText(result);
```

**Group 3**

{file-3-definitions}.js ->
```
var text = "I want to eat {0} that cost {1} dolars at least once before {2} and that would make me {3}.";
```
{file-3-script}.js ->
```
if (typeof params !== 'undefined') {
    return;
}

var result = TextFormat.Replace(text, params.food, params.cost, params.endDate, params.emotion);

output.addText(result);
```

**Group 4**

{file-4-definitions}.js ->
```
var text = "I want to eat {0} that cost {1} dolars between {2} and {3}.";
```
{file-4-script}.js ->
```
if (typeof params !== 'undefined') {
    return;
}

var result = TextFormat.Replace(text, params.food, params.cost, params.initialDate, params.endDate);

output.addText(result);
```

**Group 5**

{file-5-definitions}.js ->
```
var text = "I want to eat {0} that cost {1} dolars and that would make me {2}.";
```
{file-5-script}.js ->
```
if (typeof params !== 'undefined') {
    return;
}

var result = TextFormat.Replace(text, params.food, params.cost, params.emotion);

output.addText(result);
```

**Group 6**

{file-5-definitions}.js ->
```
var text = "I want to eat {0} that cost {1} dolars.";
```
{file-5-script}.js ->
```
output.addText(text);
```

## Notable problems

### Data aware definitions ###
Sometimes definitions have to modify its content by a variation for the phrase to make sense.

Example:  
From group 3: *least once before {8 pm}*  
From group 4: *between {10 am} and {8pm}*

Because initial date does not exist we change the phrase so it makes sense.

### Dynamic text processing ###
We want to be possible to apply functions to params fields before replacing them.

Example:
```
var alwaysSad = TextFormat.Replace(params.emotion, "sad");
var result = TextFormat.Replace(text, ..., alwaysSad, ...);
```

### Statements ###
It should be possible to add statements using param data to modify the values a param will have.

Example:
```
var type = params.type;
var paramResult;
switch (type) {
    case "a":
      paramResult = "aha";
      break;
    case "b":
      paramResult = "behe";
      break;
    case "c":
     paramResult = "cici;
     break;
}
var result = TextFormat.Replace(text, ..., paramResult);
output.addText(result);
```

NOTE: This one is not mandatory since the source can normalize its data before serializing it into params, but ideal.

## Additional problems

It's expected that each "group" also generate .java unit test files automatically.
This will be the second step of the challenge.
