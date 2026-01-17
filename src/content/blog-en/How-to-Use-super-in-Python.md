---
title: 'How to Use `super()` in Python'
pubDate: 2025-01-31T00:00:00.000Z
description: 'Master Python super() function for effective inheritance and object-oriented programming, including best practices, common patterns, and advanced techniques for building robust class hierarchies'
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
        print(f"Animal {name} created")

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)  # Initialize the parent class
        self.breed = breed
        print(f"Dog {name} of breed {breed} created")

# Usage
my_dog = Dog("Buddy", "Golden Retriever")
# Output:
# Animal Buddy created
# Dog Buddy of breed Golden Retriever created
```

### 3. Multiple Inheritance

`super()` becomes more complex but very powerful with multiple inheritance:

```python
class A:
    def method(self):
        print("A's method")

class B(A):
    def method(self):
        print("B's method")
        super().method()

class C(A):
    def method(self):
        print("C's method")
        super().method()

class D(B, C):
    def method(self):
        print("D's method")
        super().method()

# Usage
d = D()
d.method()
# Output:
# D's method
# B's method
# C's method
# A's method
```

## Method Resolution Order (MRO)

Understanding MRO is crucial when using `super()` with multiple inheritance:

```python
class D(B, C):
    pass

print(D.__mro__)
# (<class '__main__.D'>, <class '__main__.B'>, <class '__main__.C'>, <class '__main__.A'>, <class 'object'>)
```

## Best Practices

### 1. Always Use super() in Cooperative Inheritance

```python
# Good
class Parent:
    def __init__(self, value):
        self.value = value

class Child(Parent):
    def __init__(self, value, extra):
        super().__init__(value)  # Cooperative
        self.extra = extra
```

### 2. Be Consistent with Arguments

When using `super()`, ensure all methods in the inheritance chain have compatible signatures:

```python
class A:
    def method(self, *args, **kwargs):
        print("A's method")

class B(A):
    def method(self, *args, **kwargs):
        print("B's method")
        super().method(*args, **kwargs)
```

### 3. Use super() Even in Single Inheritance

Even with single inheritance, `super()` is preferred over direct parent class calls:

```python
# Good
class Child(Parent):
    def method(self):
        super().method()

# Avoid
class Child(Parent):
    def method(self):
        Parent.method(self)  # Less flexible
```

## Common Pitfalls

### 1. Forgetting to Call super()

```python
class Parent:
    def __init__(self, name):
        self.name = name

class Child(Parent):
    def __init__(self, name, age):
        # Forgot super().__init__(name)
        self.age = age  # self.name won't be set!
```

### 2. Incorrect Argument Passing

```python
class Parent:
    def __init__(self, name):
        self.name = name

class Child(Parent):
    def __init__(self, name, age):
        super().__init__()  # Missing 'name' argument!
        self.age = age
```

## Advanced Example: Diamond Problem

```python
class Base:
    def __init__(self):
        print("Base init")

class Left(Base):
    def __init__(self):
        print("Left init")
        super().__init__()

class Right(Base):
    def __init__(self):
        print("Right init")
        super().__init__()

class Child(Left, Right):
    def __init__(self):
        print("Child init")
        super().__init__()

# Usage
c = Child()
# Output:
# Child init
# Left init
# Right init
# Base init
```

## Summary

- `super()` provides access to methods in parent classes
- It's essential for cooperative inheritance
- Always use `super()` instead of direct parent class calls
- Understand MRO when working with multiple inheritance
- Be consistent with method signatures across the inheritance chain
- Don't forget to call `super()` when overriding methods that need parent functionality

Using `super()` correctly makes your code more maintainable and flexible, especially in complex inheritance hierarchies.
