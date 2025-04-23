---
title: 'How to Use `super()` in Python'
pubDate: 2025-01-31T00:00:00.000Z
description: 'Learn how to use the super() function for inheritance in Python'
author: 'Remy'
tags: ['python', 'inheritance', 'oop', 'super']
---





`super()` is a built-in function in Python that allows you to call methods from a parent or sibling class. It's particularly useful in inheritance scenarios to extend functionality while reusing code from parent classes.

## Basic Syntax

```python
super(type, object).method(*args, **kwargs)
```

In Python 3, you can simplify this to just:

```python
super().method(*args, **kwargs)
```

## Common Use Cases

### 1. Extending Parent Methods

The most common use case is to extend a parent's method while still using its functionality:

```python
class Parent:
    def greet(self):
        return "Hello from Parent!"

class Child(Parent):
    def greet(self):
        parent_greeting = super().greet()  # Call the parent's method
        return f"{parent_greeting} And hello from Child too!"
```

### 2. Initializing Parent Class

Very common in `__init__` methods to ensure proper initialization:

```python
class Animal:
    def __init__(self, name):
        self.name = name

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)  # Initialize the parent first
        self.breed = breed
```

### 3. Accessing Methods of a Specific Parent

In multiple inheritance, you may want to call a method from a specific parent:

```python
class A:
    def method(self):
        return "A's method"

class B:
    def method(self):
        return "B's method"

class C(A, B):
    def method(self):
        return f"C's method calls {super().method()}"  # Calls A's method per MRO

class D(B, A):
    def method(self):
        return f"D calls {super(B, self).method()}"  # Explicitly calls A's method
```

## Example from PocketFlow

Looking at the code from PocketFlow, `BatchNode` uses `super()` to call the parent class's `_exec()` method for each item in a batch:

```python
class BatchNode(Node):
    def _exec(self, items):
        return [super(BatchNode, self)._exec(i) for i in (items or [])]
```

This means:
1. `BatchNode` overrides `_exec()` to handle batch processing
2. For each item, it calls the parent `Node._exec()` method which includes retry logic
3. It collects all results into a list

## Best Practices

1. **Always use super() in __init__**: If inheriting from a class with an `__init__` method, call `super().__init__()` to ensure proper initialization.

2. **Remember Method Resolution Order (MRO)**: In multiple inheritance, Python follows the MRO to determine which method to call. You can check the MRO using `ClassName.__mro__`.

3. **Modern Syntax**: In Python 3, prefer the simpler `super().method()` syntax instead of `super(CurrentClass, self).method()`.

4. **Be consistent**: If a method overrides a parent method, either completely replace it or use `super()` to extend it. Partially reimplementing the parent's logic can lead to bugs.

5. **Document when necessary**: If your use of `super()` is complex (especially with multiple inheritance), add a comment explaining your intention.
