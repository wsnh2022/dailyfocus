# Python Fundamentals: Complete Reference

Pure Python only. No external libraries. Works with any standard `python` installation.

---

## Variables & Data Types

Python figures out the type automatically. You never declare it.

```python
age = 25
salary = 75000.50
name = "John"
is_active = True
result = None

print(type(age))        # <class 'int'>
print(type(salary))     # <class 'float'>
print(type(name))       # <class 'str'>
print(type(is_active))  # <class 'bool'>
print(type(result))     # <class 'NoneType'>
```

| Concept | Code | Output |
|---|---|---|
| Type name as string | `type(age).__name__` | `"int"` |
| Check specific type | `isinstance(age, int)` | `True` |
| Check multiple types | `isinstance(3.14, (int, float))` | `True` |

### Type Conversion

```python
print(int("25"))        # 25
print(float("3.14"))    # 3.14
print(str(100))         # "100"
print(int(3.9))         # 3  - truncates, does NOT round
print(bool(""))         # False
print(bool("text"))     # True
print(bool(0))          # False
print(bool(1))          # True
print(list("hello"))    # ['h', 'e', 'l', 'l', 'o']
print(set([1,2,2,3]))   # {1, 2, 3}
```

> ⚠️ `int(3.9)` gives `3`, not `4`. It truncates, it does not round. Use `round()` if you want rounding.

### Truthy & Falsy

Python treats certain values as `False` in conditions. Everything else is `True`.

```python
# All of these behave as False in an if statement
if not False:   print("falsy")
if not 0:       print("falsy")
if not "":      print("falsy")
if not []:      print("falsy")
if not {}:      print("falsy")
if not None:    print("falsy")
```

| Falsy | Truthy |
|---|---|
| `False`, `0`, `0.0` | `True`, any non-zero number |
| `""` | any non-empty string |
| `[]`, `()`, `{}`, `set()` | any non-empty collection |
| `None` | everything else |

---

## Operators

### Arithmetic

```python
print(5 + 3)    # 8
print(5 - 3)    # 2
print(5 * 3)    # 15
print(7 / 2)    # 3.5  - always float
print(7 // 2)   # 3    - floor division, rounds down
print(7 % 2)    # 1    - remainder
print(2 ** 3)   # 8    - exponent
```

> ⚠️ `/` always returns a float in Python 3. `7 / 2` is `3.5`, never `3`. Use `//` if you want integer division.

### Assignment Shortcuts

| Operator | Same as |
|---|---|
| `x += 5` | `x = x + 5` |
| `x -= 3` | `x = x - 3` |
| `x *= 2` | `x = x * 2` |
| `x /= 4` | `x = x / 4` |
| `x //= 2` | `x = x // 2` |
| `x %= 3` | `x = x % 3` |
| `x **= 2` | `x = x ** 2` |

### Comparison

```python
print(5 == 5)    # True
print(5 != 3)    # True
print(5 > 3)     # True
print(3 < 5)     # True
print(5 >= 5)    # True
print(3 <= 5)    # True

x = 5
print(0 < x < 10)   # True  - chained comparisons work in Python
```

### Logical

```python
print(True and False)   # False - both must be True
print(True or False)    # True  - at least one must be True
print(not True)         # False - flips the value
```

### Membership & Identity

```python
print(5 in [1, 5, 9])       # True
print(4 not in [1, 5, 9])   # True

x = None
print(x is None)            # True
print(x is not None)        # False
```

> ⚠️ Use `==` for value comparison. Use `is` only for `None`, `True`, `False`. Never do `x is 5` or `x is "hello"` - it may work sometimes due to Python internals but it is not guaranteed.

---

## Input / Output

```python
name = input("Enter name: ")   # always returns a string
age = int(input("Age: "))      # convert immediately after input
price = float(input("Price: "))

print("Hello")
print("Name:", name, "Age:", age)
print(f"Name: {name}, Age: {age}")     # f-string (preferred)
print("Hello {}".format(name))         # .format() style

print("loading", end="")    # no newline at end
print("a", "b", "c", sep="-")  # a-b-c
```

### F-string Formatting

```python
price = 75000.5
ratio = 0.855
num = 42
salary = 75000

print(f"{price:.2f}")    # 75000.50   - 2 decimal places
print(f"{salary:,}")     # 75,000     - comma separator
print(f"{num:05d}")      # 00042      - zero-padded to 5 digits
print(f"{ratio:.1%}")    # 85.5%      - percentage
```

---

## Strings

Strings are immutable. Every method returns a new string. The original never changes.

```python
text = "Hello World"
print(text.lower())              # hello world
print(text.upper())              # HELLO WORLD
print(text.replace("World", "Python"))  # Hello Python
print(text)                      # Hello World  - unchanged
```

### Accessing Characters

```python
text = "Hello"
print(text[0])      # H      - first character
print(text[-1])     # o      - last character
print(text[1:4])    # ell    - slice from index 1 to 3
print(text[:3])     # Hel    - first 3 characters
print(text[2:])     # llo    - from index 2 to end
print(text[::-1])   # olleH  - reversed
print(len(text))    # 5
```

### Searching

| Concept | Code | Output / Notes |
|---|---|---|
| Find position | `"hello".find("l")` | `2` - returns -1 if not found |
| Find from right | `"hello".rfind("l")` | `3` |
| Index (strict) | `"hello".index("l")` | `2` - raises ValueError if not found |
| Count occurrences | `"hello".count("l")` | `2` |
| Contains | `"ell" in "hello"` | `True` |
| Starts with | `"hello".startswith("he")` | `True` |
| Ends with | `"data.csv".endswith(".csv")` | `True` |

### Modifying

| Concept | Code | Output |
|---|---|---|
| Lowercase | `"HELLO".lower()` | `"hello"` |
| Uppercase | `"hello".upper()` | `"HELLO"` |
| Title case | `"hello world".title()` | `"Hello World"` |
| Capitalize | `"hello world".capitalize()` | `"Hello world"` |
| Strip whitespace | `"  hi  ".strip()` | `"hi"` |
| Strip left | `"  hi  ".lstrip()` | `"hi  "` |
| Strip right | `"  hi  ".rstrip()` | `"  hi"` |
| Replace | `"aabbaa".replace("a","x")` | `"xxbbxx"` |
| Replace first only | `"aabbaa".replace("a","x",1)` | `"xabbaa"` |
| Zero pad | `"42".zfill(5)` | `"00042"` |

### Splitting & Joining

```python
text = "one,two,three"
print(text.split(","))          # ['one', 'two', 'three']
print(text.split(",", 1))       # ['one', 'two,three']  - split at first only

words = ["one", "two", "three"]
print(",".join(words))          # one,two,three
print("\n".join(words))         # each word on its own line

print("a=b".partition("="))     # ('a', '=', 'b')
```

### Checking Content

| Concept | Code | Output |
|---|---|---|
| All digits | `"123".isdigit()` | `True` |
| All letters | `"abc".isalpha()` | `True` |
| Letters and digits | `"abc123".isalnum()` | `True` |
| All whitespace | `"   ".isspace()` | `True` |
| All lowercase | `"hello".islower()` | `True` |
| All uppercase | `"HELLO".isupper()` | `True` |

### Escape Characters

| Character | Meaning |
|---|---|
| `\n` | newline |
| `\t` | tab |
| `\\` | literal backslash |
| `\"` | literal double quote |
| `\'` | literal single quote |

```python
path = r"C:\Users\name"   # raw string - backslashes treated literally
print(path)               # C:\Users\name
```

---

## Numbers

```python
print(abs(-5))              # 5
print(round(3.14159, 2))    # 3.14
print(round(3.7))           # 4
print(pow(2, 3))            # 8
print(max(5, 10, 3))        # 10
print(min(5, 10, 3))        # 3
print(sum([1, 2, 3]))       # 6
print(divmod(7, 2))         # (3, 1)  - (quotient, remainder)
print(bin(10))              # 0b1010
print(hex(255))             # 0xff
```

> ⚠️ `round(2.5)` returns `2`, not `3`. Python uses banker's rounding (round half to even). `round(3.5)` returns `4`. This surprises most people.

```python
print(round(2.5))   # 2  - rounds to nearest even
print(round(3.5))   # 4  - rounds to nearest even
print(round(4.5))   # 4  - rounds to nearest even
```

> ⚠️ Floating point is not exact. `0.1 + 0.2` does not equal `0.3` in Python (or any language using IEEE 754).

```python
print(0.1 + 0.2)            # 0.30000000000000004
print(0.1 + 0.2 == 0.3)     # False
print(round(0.1 + 0.2, 1) == 0.3)  # True  - workaround
```

---

## Lists

Ordered, mutable collections. The most used data structure in Python.

### Creating

```python
items = []                          # empty list
scores = [85, 92, 78, 95, 88]
data = [1, "hello", True, 3.14]     # mixed types are fine
nums = list(range(1, 6))            # [1, 2, 3, 4, 5]
chars = list("hello")               # ['h', 'e', 'l', 'l', 'o']
zeros = [0] * 5                     # [0, 0, 0, 0, 0]
matrix = [[1,2], [3,4], [5,6]]      # nested list
```

### Accessing

```python
scores = [85, 92, 78, 95, 88]
print(scores[0])        # 85
print(scores[-1])       # 88    - last item
print(scores[1:4])      # [92, 78, 95]
print(scores[:3])       # [85, 92, 78]
print(scores[2:])       # [78, 95, 88]
print(scores[-2:])      # [95, 88]
print(scores[::-1])     # [88, 95, 78, 92, 85]  - reversed

matrix = [[1,2], [3,4]]
print(matrix[0][1])     # 2
```

### Adding Items

```python
scores = [85, 92, 78]
scores.append(91)           # [85, 92, 78, 91]
scores.insert(0, 100)       # [100, 85, 92, 78, 91]
scores.extend([96, 97])     # [100, 85, 92, 78, 91, 96, 97]

combined = [1, 2] + [3, 4]  # [1, 2, 3, 4]  - creates new list
```

### Removing Items

```python
scores = [85, 92, 78, 92, 88]
scores.remove(92)       # removes first match → [85, 78, 92, 88]
val = scores.pop(1)     # removes index 1, returns it → val=78
last = scores.pop()     # removes last item, returns it
del scores[0]           # removes by index, returns nothing
scores.clear()          # []
```

### Sorting

```python
scores = [85, 92, 78, 95, 88]
scores.sort()                       # sorts in place → [78, 85, 88, 92, 95]
scores.sort(reverse=True)           # [95, 92, 88, 85, 78]

words = ["banana", "apple", "kiwi"]
words.sort(key=len)                 # sort by string length → ['kiwi', 'apple', 'banana']

new_sorted = sorted(scores)         # returns new list, does not modify original
```

### Searching

```python
scores = [85, 92, 78, 95, 88]
print(85 in scores)         # True
print(scores.index(92))     # 1
print(scores.count(85))     # 1
print(len(scores))          # 5
print(min(scores))          # 78
print(max(scores))          # 95
print(sum(scores))          # 438
```

### Copying

```python
a = [1, 2, 3]

# WRONG - this does NOT copy, both names point to same list
b = a
b.append(4)
print(a)    # [1, 2, 3, 4]  - a changed too!

# CORRECT ways to copy
b = a.copy()
b = a[:]
b = list(a)
```

> ⚠️ Copying only works one level deep. For nested lists you need `copy.deepcopy()`. See the Shallow vs Deep Copy section.

---

## Tuples

Ordered, immutable collections. Use when data should not change after creation.

```python
coords = (10.5, 20.3)
single = (42,)              # comma required for single-item tuple
also_tuple = 1, 2, 3        # parentheses optional

print(coords[0])            # 10.5
print(coords[-1])           # 20.3
print(len(coords))          # 2
print(10.5 in coords)       # True

x, y = coords               # unpacking
print(x)                    # 10.5
```

> ⚠️ `(42)` is just parentheses around an integer. `(42,)` is the tuple. The comma is what makes it a tuple.

Tuples are faster than lists and can be used as dictionary keys (lists cannot).

```python
location = {(10.5, 20.3): "office"}    # valid - tuple as dict key
# {[10.5, 20.3]: "office"}             # TypeError - list is not hashable
```

---

## Sets

Unordered collections with no duplicates. Fast membership checks.

### Creating

```python
unique = {1, 2, 3}
deduped = set([1, 2, 3, 2, 1])     # {1, 2, 3}
empty = set()                        # NOT {} - that creates a dict
chars = set("hello")                 # {'h', 'e', 'l', 'o'}  - 'l' appears once
```

> ⚠️ `{}` creates an empty dict, not a set. Use `set()` for empty sets.

### Modifying

```python
s = {1, 2, 3}
s.add(4)            # {1, 2, 3, 4}
s.update([4,5,6])   # {1, 2, 3, 4, 5, 6}
s.remove(2)         # removes 2 - raises KeyError if not found
s.discard(99)       # safe remove - no error if 99 not in set
```

### Set Operations

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)    # {1, 2, 3, 4, 5, 6}  - union (all from both)
print(a & b)    # {3, 4}              - intersection (common only)
print(a - b)    # {1, 2}             - difference (in a but not b)
print(a ^ b)    # {1, 2, 5, 6}       - symmetric difference (not common)

print(a.issubset(b))     # False
print(a.issuperset(b))   # False
print(a.isdisjoint({7, 8}))  # True  - no overlap
```

`in` checks on sets are much faster than on lists for large collections.

---

## Dictionaries

Key-value pairs. The go-to structure for labeled data.

### Creating

```python
employee = {"name": "John", "age": 30}
empty = {}
from_pairs = dict([("a", 1), ("b", 2)])        # {"a": 1, "b": 2}
defaults = dict.fromkeys(["a","b","c"], 0)      # {"a": 0, "b": 0, "c": 0}
nested = {"emp1": {"name": "John", "score": 92}}
```

### Accessing

```python
employee = {"name": "John", "age": 30}

print(employee["name"])             # John
# print(employee["salary"])         # KeyError - key doesn't exist

print(employee.get("salary"))       # None    - safe, no error
print(employee.get("salary", 0))    # 0       - default if missing

print(employee.keys())              # dict_keys(['name', 'age'])
print(employee.values())            # dict_values(['John', 30])
print(employee.items())             # dict_items([('name', 'John'), ('age', 30)])

nested = {"emp1": {"name": "John", "score": 92}}
print(nested["emp1"]["name"])       # John
```

### Modifying

```python
employee = {"name": "John", "age": 30}

employee["salary"] = 75000          # add new key
employee["age"] = 31                # update existing key
employee.update({"salary": 80000, "city": "Chennai"})
employee.setdefault("dept", "General")   # adds only if key missing

del employee["age"]                 # removes key
val = employee.pop("salary", None)  # removes and returns, None if missing
last = employee.popitem()           # removes and returns last inserted pair
employee.clear()                    # {}
```

### Checking

```python
employee = {"name": "John", "age": 30}
print("name" in employee)           # True   - checks keys
print("John" in employee.values())  # True   - checks values
print(len(employee))                # 2
```

### Looping

```python
employee = {"name": "John", "age": 30}

for key in employee:
    print(key)              # name, age

for val in employee.values():
    print(val)              # John, 30

for key, val in employee.items():
    print(f"{key}: {val}")  # name: John  /  age: 30
```

### Merging

```python
d1 = {"a": 1, "b": 2}
d2 = {"b": 99, "c": 3}

merged = d1 | d2            # Python 3.9+ → {"a": 1, "b": 99, "c": 3}
merged = {**d1, **d2}       # older Python → same result

# Note: d2 values win on key conflict ("b" becomes 99)
```

---

## Conditionals

### if / elif / else

```python
score = 82

if score > 90:
    print("A")
elif score > 75:
    print("B")
else:
    print("C")
# B
```

```python
age = 20
status = "active"

if age > 18 and status == "active":
    print("eligible")           # eligible

role = "viewer"
if role == "admin" or role == "owner":
    print("has access")         # not printed

my_list = []
if not my_list:
    print("list is empty")      # list is empty

value = None
if value is None:
    print("no value set")       # no value set
```

### Ternary

```python
score = 82
grade = "Pass" if score > 50 else "Fail"
print(grade)    # Pass

label = "A" if score > 90 else "B" if score > 75 else "C"
print(label)    # B
```

### Walrus Operator (3.8+)

Assigns and tests a value in one expression.

```python
items = [1, 2, 3, 4, 5, 6]

if (n := len(items)) > 5:
    print(f"Too many items: {n}")   # Too many items: 6
```

```python
# Useful in while loops
while (line := input("Enter text (or 'quit'): ")) != "quit":
    print(f"You entered: {line}")
```

### Match-Case (3.10+)

```python
command = "quit"

match command:
    case "quit":
        print("Exiting")
    case "help":
        print("Showing help")
    case _:
        print("Unknown command")
# Exiting
```

---

## Loops

### For Loop

```python
scores = [85, 92, 78]

for score in scores:
    print(score)        # 85, 92, 78

for char in "hello":
    print(char)         # h, e, l, l, o

for i in range(5):
    print(i)            # 0, 1, 2, 3, 4

for i in range(1, 6):
    print(i)            # 1, 2, 3, 4, 5

for i in range(0, 10, 2):
    print(i)            # 0, 2, 4, 6, 8

for i in range(5, 0, -1):
    print(i)            # 5, 4, 3, 2, 1
```

### enumerate and zip

```python
items = ["apple", "banana", "kiwi"]

for i, val in enumerate(items):
    print(i, val)       # 0 apple / 1 banana / 2 kiwi

for i, val in enumerate(items, start=1):
    print(i, val)       # 1 apple / 2 banana / 3 kiwi

names = ["Alice", "Bob"]
ages = [25, 30]

for name, age in zip(names, ages):
    print(name, age)    # Alice 25 / Bob 30
```

### While Loop

```python
count = 0
while count < 3:
    print(count)    # 0, 1, 2
    count += 1

# Infinite loop with break
while True:
    answer = input("Type 'yes': ")
    if answer == "yes":
        break
```

### Loop Control

```python
for i in range(5):
    if i == 3:
        break           # exits loop entirely
    print(i)            # 0, 1, 2

for i in range(5):
    if i == 3:
        continue        # skips to next iteration
    print(i)            # 0, 1, 2, 4
```

### For-Else

The `else` block runs only if the loop completed without hitting `break`.

```python
items = [1, 2, 3, 4]

for item in items:
    if item == 99:
        break
else:
    print("99 not found")   # prints - loop finished without break
```

---

## Comprehensions

One-line shortcuts for building lists, dicts, and sets.

### List Comprehension

```python
# Basic
doubled = [x * 2 for x in range(5)]
print(doubled)          # [0, 2, 4, 6, 8]

# With filter
scores = [85, 92, 78, 95, 88]
high = [x for x in scores if x > 85]
print(high)             # [92, 95, 88]

# Transform + filter
high_doubled = [x * 2 for x in scores if x > 85]
print(high_doubled)     # [184, 190, 176]

# If-else in value
labels = ["pass" if x > 80 else "fail" for x in scores]
print(labels)           # ['pass', 'pass', 'fail', 'pass', 'pass']

# Flatten nested list
matrix = [[1, 2], [3, 4], [5, 6]]
flat = [x for row in matrix for x in row]
print(flat)             # [1, 2, 3, 4, 5, 6]
```

### Dictionary Comprehension

```python
prices = {"apple": 1.0, "banana": 0.5, "kiwi": 2.0}

# Double all prices
new = {k: v * 2 for k, v in prices.items()}
print(new)      # {'apple': 2.0, 'banana': 1.0, 'kiwi': 4.0}

# Filter
cheap = {k: v for k, v in prices.items() if v < 1.5}
print(cheap)    # {'apple': 1.0, 'banana': 0.5}

# From two lists
keys = ["a", "b", "c"]
values = [1, 2, 3]
d = {k: v for k, v in zip(keys, values)}
print(d)        # {'a': 1, 'b': 2, 'c': 3}

# Swap keys and values
flipped = {v: k for k, v in prices.items()}
print(flipped)  # {1.0: 'apple', 0.5: 'banana', 2.0: 'kiwi'}
```

### Set Comprehension

```python
words = ["Hello", "HELLO", "hello", "World"]
unique_lower = {w.lower() for w in words}
print(unique_lower)     # {'hello', 'world'}

numbers = [1, 2, 3, 4, 5, 6]
evens = {x for x in numbers if x % 2 == 0}
print(evens)            # {2, 4, 6}
```

### Generator Expression

Same syntax as list comprehension but with `()`. Produces values one at a time instead of building the entire list in memory.

```python
# List comprehension - builds entire list in memory
squares_list = [x ** 2 for x in range(1000000)]

# Generator - produces one value at a time
squares_gen = (x ** 2 for x in range(1000000))

# Use directly in functions - no extra memory
total = sum(x * 2 for x in range(100))
print(total)        # 9900

longest = max(len(w) for w in ["apple", "banana", "kiwi"])
print(longest)      # 6

any_large = any(x > 90 for x in [85, 92, 78])
print(any_large)    # True
```

---

## Functions

### Defining & Calling

```python
def greet():
    print("Hello")

def greet_name(name):
    print(f"Hello {name}")

def add(a, b):
    return a + b

def stats(data):
    return min(data), max(data)     # returns a tuple

greet()                         # Hello
greet_name("John")              # Hello John
result = add(3, 5)              # 8
lo, hi = stats([5, 2, 9, 1])   # lo=1, hi=9
```

### Parameters & Arguments

```python
# Default value
def greet(name="World"):
    print(f"Hello {name}")

greet()             # Hello World
greet("John")       # Hello John
greet(name="John")  # Hello John - keyword argument

# *args - variable number of positional arguments
def total(*args):
    return sum(args)

print(total(1, 2, 3, 4))    # 10

# **kwargs - variable number of keyword arguments
def config(**kwargs):
    for k, v in kwargs.items():
        print(f"{k}: {v}")

config(host="localhost", port=3000)
# host: localhost
# port: 3000
```

```python
# Keyword-only - must be passed by name
def connect(*, host, port):
    print(f"{host}:{port}")

connect(host="localhost", port=3000)    # works
# connect("localhost", 3000)            # TypeError

# Positional-only - must be passed by position
def add(a, b, /):
    return a + b

add(1, 2)           # works
# add(a=1, b=2)     # TypeError
```

### Lambda

```python
double = lambda x: x * 2
print(double(5))    # 10

add = lambda a, b: a + b
print(add(3, 4))    # 7

# Common use: as a sort key
people = [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]
people.sort(key=lambda p: p["age"])
print(people[0]["name"])    # Bob - sorted by age ascending

# map and filter
numbers = [1, 2, 3, 4, 5]
print(list(map(lambda x: x ** 2, numbers)))     # [1, 4, 9, 16, 25]
print(list(filter(lambda x: x > 2, numbers)))   # [3, 4, 5]
```

### Scope

```python
count = 0   # global

def increment():
    global count        # must declare to modify global
    count += 1

increment()
print(count)    # 1

def outer():
    x = 10
    def inner():
        nonlocal x      # modify enclosing function's variable
        x += 1
    inner()
    print(x)    # 11

outer()
```

### Higher-Order Functions

```python
words = ["banana", "apple", "kiwi"]

print(sorted(words, key=len))               # ['kiwi', 'apple', 'banana']
print(sorted(words, key=len, reverse=True)) # ['banana', 'apple', 'kiwi']

employees = [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]
youngest = min(employees, key=lambda e: e["age"])
print(youngest["name"])     # Bob

print(list(map(str.upper, words)))          # ['BANANA', 'APPLE', 'KIWI']
```

---

## None / NoneType

```python
result = None

print(result is None)       # True   - use 'is', not '=='
print(result is not None)   # False
print(bool(None))           # False  - None is falsy
print(type(None))           # <class 'NoneType'>

def log(msg):
    print(msg)
    # no return statement

val = log("hello")
print(val)      # None  - functions without return give None
```

```python
# Safe default pattern - avoids mutable default argument bug
def append_to(item, lst=None):
    if lst is None:
        lst = []
    lst.append(item)
    return lst

# Filter out None from a list
data = [1, None, 3, None, 5]
clean = [x for x in data if x is not None]
print(clean)    # [1, 3, 5]
```

> ⚠️ Never use `def foo(lst=[])`. Default mutable arguments are created once and shared across all calls. Use `None` as the default and create the object inside the function.

---

## Unpacking

```python
a, b = 1, 2
print(a, b)         # 1 2

x, y = (10.5, 20.3)
print(x, y)         # 10.5 20.3

# Swap without temp variable
a, b = b, a
print(a, b)         # 2 1

# Star unpacking
first, *rest = [1, 2, 3, 4, 5]
print(first)    # 1
print(rest)     # [2, 3, 4, 5]

first, *mid, last = [1, 2, 3, 4, 5]
print(mid)      # [2, 3, 4]

# Ignore values with _
_, important, _ = (10, 42, 99)
print(important)    # 42

# In loops
pairs = [("Alice", 25), ("Bob", 30)]
for name, age in pairs:
    print(f"{name} is {age}")
```

---

## Mutable vs Immutable

| Mutable (can change) | Immutable (cannot change) |
|---|---|
| `list` | `int`, `float`, `str`, `bool` |
| `dict` | `tuple`, `frozenset` |
| `set` | `None` |

```python
# Mutable aliasing problem
a = [1, 2, 3]
b = a           # b is NOT a copy, both point to same list
b.append(4)
print(a)        # [1, 2, 3, 4]  - a changed too

# Strings look mutable but aren't
s = "hello"
s = s.upper()   # creates a new string, original is gone
```

---

## Shallow Copy vs Deep Copy

```python
import copy

a = [1, 2, 3]
b = a.copy()        # or a[:] or list(a)
b.append(99)
print(a)    # [1, 2, 3]  - unchanged
print(b)    # [1, 2, 3, 99]
```

### Where Shallow Copy Fails

```python
a = [[1, 2], [3, 4]]
b = a.copy()            # shallow copy

b[0].append(99)
print(a)    # [[1, 2, 99], [3, 4]]  - inner list is shared!
print(b)    # [[1, 2, 99], [3, 4]]
```

```python
# Fix: use deepcopy
a = [[1, 2], [3, 4]]
b = copy.deepcopy(a)

b[0].append(99)
print(a)    # [[1, 2], [3, 4]]      - untouched
print(b)    # [[1, 2, 99], [3, 4]]
```

> ⚠️ Shallow copy only copies the outer container. Nested lists, dicts, or objects inside are still shared. Always use `copy.deepcopy()` for nested structures.

---

## Imports & Modules

```python
import os
import os as operating_system        # alias
from os import path                  # specific item
from os import path, makedirs        # multiple items
# from os import *                   # avoid - pollutes namespace

if __name__ == "__main__":
    print("running directly")
    # this block does NOT run when the file is imported
```

| Scenario | `__name__` value |
|---|---|
| `python script.py` | `"__main__"` |
| `import script` from another file | `"script"` |

---

## Classes

### Defining

```python
class Dog:
    count = 0   # class variable - shared across all instances

    def __init__(self, name, breed):
        self.name = name        # instance variable - unique per dog
        self.breed = breed
        Dog.count += 1

    def bark(self):
        return f"{self.name} says Woof!"

    def __str__(self):
        return f"Dog({self.name}, {self.breed})"

    def __repr__(self):
        return f"Dog(name={self.name!r}, breed={self.breed!r})"

my_dog = Dog("Max", "Golden")
print(my_dog.bark())    # Max says Woof!
print(str(my_dog))      # Dog(Max, Golden)
print(Dog.count)        # 1
```

### Special (Dunder) Methods

| Method | Triggered by | Example |
|---|---|---|
| `__init__` | `Dog("Max", "Golden")` | constructor |
| `__str__` | `print(obj)`, `str(obj)` | readable string |
| `__repr__` | console, debugger | debug string |
| `__len__` | `len(obj)` | length |
| `__eq__` | `obj1 == obj2` | equality |
| `__lt__` | `obj1 < obj2` | less than |
| `__getitem__` | `obj[0]` | index access |
| `__contains__` | `x in obj` | membership |

### Inheritance

```python
class Puppy(Dog):
    def __init__(self, name, breed, age_months):
        super().__init__(name, breed)   # call parent constructor
        self.age_months = age_months

    def bark(self):     # override parent method
        return f"{self.name} says Yip!"

pup = Puppy("Buddy", "Lab", 3)
print(pup.bark())               # Buddy says Yip!
print(isinstance(pup, Dog))     # True
print(issubclass(Puppy, Dog))   # True
```

### Properties

```python
class Employee:
    def __init__(self, name, salary):
        self._salary = salary
        self.name = name

    @property
    def salary(self):
        return self._salary

    @salary.setter
    def salary(self, value):
        if value < 0:
            raise ValueError("Salary cannot be negative")
        self._salary = value

emp = Employee("Alice", 75000)
print(emp.salary)       # 75000  - calls getter
emp.salary = 80000      # calls setter
# emp.salary = -100     # ValueError
```

### Static & Class Methods

```python
class MathHelper:
    base = 10

    @staticmethod
    def square(x):          # no self, no cls - just a utility
        return x ** 2

    @classmethod
    def describe(cls):      # gets the class, not the instance
        return f"Base is {cls.base}"

print(MathHelper.square(5))     # 25
print(MathHelper.describe())    # Base is 10
```

---

## File Handling

Always use `with`. It automatically closes the file even if an error occurs.

### Reading

```python
with open("data.txt") as f:
    content = f.read()          # entire file as one string

with open("data.txt") as f:
    lines = f.readlines()       # list of lines, each with \n

with open("data.txt") as f:
    for line in f:              # memory-efficient for large files
        print(line.strip())

with open("data.txt", encoding="utf-8") as f:
    content = f.read()
```

### Writing

```python
with open("out.txt", "w") as f:
    f.write("Hello\n")          # overwrites if file exists

with open("log.txt", "a") as f:
    f.write("new entry\n")      # appends to end

with open("out.txt", "w") as f:
    f.writelines(["line1\n", "line2\n"])
```

### File Modes

| Mode | Meaning |
|---|---|
| `"r"` | read (default) |
| `"w"` | write - overwrites existing content |
| `"a"` | append - adds to end |
| `"x"` | create - fails if file exists |
| `"rb"`, `"wb"` | binary read/write |
| `"r+"` | read and write |

### File Position

```python
with open("data.txt") as f:
    f.read()
    print(f.tell())     # current position in bytes
    f.seek(0)           # go back to start
    content = f.read()  # read again from beginning
```

---

## Error Handling

### Try / Except / Else / Finally

```python
try:
    result = 10 / 0
except ZeroDivisionError:
    print("cannot divide by zero")      # this runs
except ValueError as e:
    print(f"value error: {e}")
else:
    print("no error occurred")          # only runs if no exception
finally:
    print("always runs")                # runs regardless
```

```python
# Multiple exceptions in one line
try:
    value = int("abc")
except (ValueError, TypeError) as e:
    print(f"conversion failed: {e}")    # conversion failed: invalid literal...
```

> ⚠️ Always catch specific exceptions first. A bare `except:` will catch everything including `KeyboardInterrupt` and `SystemExit`, which is almost never what you want.

### Common Exception Types

| Exception | When it fires |
|---|---|
| `ValueError` | right type, wrong value: `int("abc")` |
| `TypeError` | wrong type: `"text" + 5` |
| `KeyError` | dict key missing: `d["missing"]` |
| `IndexError` | index out of range: `[1,2][5]` |
| `AttributeError` | no such method: `"text".nonexistent()` |
| `NameError` | variable not defined |
| `ZeroDivisionError` | dividing by zero |
| `FileNotFoundError` | file doesn't exist |
| `ImportError` | module not found |
| `StopIteration` | iterator exhausted |

### Raising Exceptions

```python
def set_age(age):
    if age < 0:
        raise ValueError(f"age cannot be negative, got {age}")
    return age

try:
    set_age(-5)
except ValueError as e:
    print(e)    # age cannot be negative, got -5

# Custom exception
class InsufficientFundsError(Exception):
    pass

raise InsufficientFundsError("balance too low")
```

---

## Context Managers

The `with` statement. Handles setup and cleanup automatically.

```python
# File - auto-closes
with open("data.txt") as f:
    data = f.read()

# Multiple resources
with open("input.txt") as fin, open("output.txt", "w") as fout:
    fout.write(fin.read())

# Custom context manager using decorator
from contextlib import contextmanager

@contextmanager
def timer():
    import time
    start = time.time()
    yield                               # code inside `with` runs here
    end = time.time()
    print(f"Elapsed: {end - start:.2f}s")

with timer():
    total = sum(range(1000000))
# Elapsed: 0.03s  (time varies)
```

---

## Generators

Functions that produce values one at a time using `yield`. Memory-efficient for large sequences.

```python
def count_up(n):
    for i in range(n):
        yield i

for val in count_up(5):
    print(val)      # 0, 1, 2, 3, 4

gen = count_up(5)
print(next(gen))    # 0
print(next(gen))    # 1

print(list(count_up(5)))    # [0, 1, 2, 3, 4]
```

```python
# Infinite generator - only safe because values are pulled one at a time
def integers_from(start):
    n = start
    while True:
        yield n
        n += 1

gen = integers_from(1)
print(next(gen))    # 1
print(next(gen))    # 2
print(next(gen))    # 3
```

| `return` | `yield` |
|---|---|
| Exits function permanently | Pauses, resumes on next call |
| One value | Many values, one at a time |
| Entire result in memory | One value in memory at a time |
| Regular function | Generator function |

---

## Iterators

Every `for` loop uses an iterator under the hood.

```python
it = iter([1, 2, 3])
print(next(it))     # 1
print(next(it))     # 2
print(next(it))     # 3
# print(next(it))   # StopIteration

print(next(it, "done"))     # "done"  - default instead of error
```

| Iterable | Iterator |
|---|---|
| Has `__iter__()` | Has `__iter__()` AND `__next__()` |
| Can create an iterator | Is the iterator |
| `list`, `str`, `dict`, `range` | result of `iter()`, generators, file objects |
| Can loop multiple times | Exhausts after one pass |

```python
nums = [1, 2, 3]

# A list is iterable but not an iterator
for n in nums: print(n)     # works
for n in nums: print(n)     # works again - resets

it = iter(nums)
for n in it: print(n)       # works
for n in it: print(n)       # prints nothing - already exhausted
```

---

## Decorators

Functions that wrap other functions to add behavior without changing their code.

```python
def my_decorator(func):
    from functools import wraps

    @wraps(func)                    # preserves original function's metadata
    def wrapper(*args, **kwargs):
        print("before")
        result = func(*args, **kwargs)
        print("after")
        return result
    return wrapper

@my_decorator
def say_hello():
    print("hello")

say_hello()
# before
# hello
# after
```

### Practical Examples

```python
import time
from functools import wraps

# Timer decorator
def timer(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.4f}s")
        return result
    return wrapper

@timer
def slow_sum(n):
    return sum(range(n))

slow_sum(1000000)   # slow_sum took 0.0312s  (time varies)
```

```python
import functools

# Built-in cache decorator - remembers past results
@functools.lru_cache(maxsize=None)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(30))    # 832040  - fast because results are cached
```

---

## Type Hints

Optional annotations. Python does not enforce them. Editors and linters use them to catch bugs early.

```python
def greet(name: str) -> str:
    return f"Hello {name}"

def add(a: int, b: int) -> int:
    return a + b

def average(nums: list[int]) -> float:
    return sum(nums) / len(nums)

def log(msg: str) -> None:
    print(msg)

def find(name: str) -> str | None:     # can return str or None
    if name == "John":
        return "found"
    return None

def config() -> dict[str, int]:
    return {"timeout": 30, "retries": 3}
```

> ⚠️ Type hints are documentation, not enforcement. `add("a", "b")` will still run without error. Use a type checker like `mypy` if you want actual enforcement.

---

## Built-in Functions

### Most Used

| Function | What it does | Example | Output |
|---|---|---|---|
| `len()` | length of collection | `len([1,2,3])` | `3` |
| `type()` | check data type | `type(42)` | `<class 'int'>` |
| `isinstance()` | check type match | `isinstance(42, int)` | `True` |
| `range()` | sequence of numbers | `list(range(3))` | `[0, 1, 2]` |
| `enumerate()` | index + value pairs | `list(enumerate(["a","b"]))` | `[(0,'a'),(1,'b')]` |
| `zip()` | pair items | `list(zip([1,2],["a","b"]))` | `[(1,'a'),(2,'b')]` |
| `sorted()` | new sorted list | `sorted([3,1,2])` | `[1, 2, 3]` |
| `reversed()` | reverse iterator | `list(reversed([1,2,3]))` | `[3, 2, 1]` |
| `map()` | apply to all | `list(map(str,[1,2,3]))` | `['1','2','3']` |
| `filter()` | keep matching | `list(filter(bool,[0,1,"",2]))` | `[1, 2]` |

### Math & Comparison

| Function | Example | Output |
|---|---|---|
| `abs()` | `abs(-5)` | `5` |
| `round()` | `round(3.14, 1)` | `3.1` |
| `min()` | `min(3, 1, 5)` | `1` |
| `max()` | `max(3, 1, 5)` | `5` |
| `sum()` | `sum([1,2,3])` | `6` |
| `pow()` | `pow(2, 3)` | `8` |
| `divmod()` | `divmod(7, 2)` | `(3, 1)` |

### Type Conversion

| Function | Example | Output |
|---|---|---|
| `int()` | `int("42")` | `42` |
| `float()` | `float("3.14")` | `3.14` |
| `str()` | `str(42)` | `"42"` |
| `bool()` | `bool(0)` | `False` |
| `list()` | `list("abc")` | `['a','b','c']` |
| `tuple()` | `tuple([1,2])` | `(1, 2)` |
| `set()` | `set([1,1,2])` | `{1, 2}` |
| `dict()` | `dict([("a",1)])` | `{"a": 1}` |

### Checking & Testing

| Function | Example | Output |
|---|---|---|
| `any()` | `any([False, True, False])` | `True` |
| `all()` | `all([True, True, False])` | `False` |
| `callable()` | `callable(print)` | `True` |
| `hasattr()` | `hasattr("text", "upper")` | `True` |

### Characters & Encoding

| Function | Example | Output |
|---|---|---|
| `chr()` | `chr(65)` | `"A"` |
| `ord()` | `ord("A")` | `65` |
| `bin()` | `bin(10)` | `"0b1010"` |
| `hex()` | `hex(255)` | `"0xff"` |
| `repr()` | `repr("hi")` | `"'hi'"` |
