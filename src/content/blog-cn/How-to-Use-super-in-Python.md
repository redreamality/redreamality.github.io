---
title: '如何在 Python 中使用 `super()`'
pubDate: 2025-01-31T00:00:00.000Z
description: '学习如何在 Python 继承中使用 super() 函数'
author: 'Remy'
tags: ['python', '继承', '面向对象编程', 'super']
---




`super()` 是 Python 中的一个内置函数，允许你调用父类或兄弟类的方法。它在继承场景中特别有用，可以在重用父类代码的同时扩展功能。

## 基本语法

```python
super(type, object).method(*args, **kwargs)
```

在 Python 3 中，你可以简化为：

```python
super().method(*args, **kwargs)
```

## 常见用例

### 1. 扩展父类方法

最常见的用例是扩展父类的方法，同时仍然使用其功能：

```python
class Parent:
    def greet(self):
        return "Hello from Parent!"

class Child(Parent):
    def greet(self):
        parent_greeting = super().greet()  # 调用父类的方法
        return f"{parent_greeting} And hello from Child too!"
```

### 2. 初始化父类

在 `__init__` 方法中非常常见，确保正确初始化：

```python
class Animal:
    def __init__(self, name):
        self.name = name
        print(f"Animal {name} created")

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)  # 初始化父类
        self.breed = breed
        print(f"Dog {name} of breed {breed} created")

## 使用
my_dog = Dog("Buddy", "Golden Retriever")
## 输出:
## Animal Buddy created
## Dog Buddy of breed Golden Retriever created
```

### 3. 多重继承

`super()` 在多重继承中变得更复杂但非常强大：

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

## 使用
d = D()
d.method()
## 输出:
## D's method
## B's method
## C's method
## A's method
```

## 方法解析顺序 (MRO)

在多重继承中使用 `super()` 时，理解 MRO 至关重要：

```python
class D(B, C):
    pass

print(D.__mro__)
## (<class '__main__.D'>, <class '__main__.B'>, <class '__main__.C'>, <class '__main__.A'>, <class 'object'>)
```

## 最佳实践

### 1. 在协作继承中始终使用 super()

```python
## 好的做法
class Parent:
    def __init__(self, value):
        self.value = value

class Child(Parent):
    def __init__(self, value, extra):
        super().__init__(value)  # 协作式
        self.extra = extra
```

### 2. 保持参数一致性

使用 `super()` 时，确保继承链中的所有方法都有兼容的签名：

```python
class A:
    def method(self, *args, **kwargs):
        print("A's method")

class B(A):
    def method(self, *args, **kwargs):
        print("B's method")
        super().method(*args, **kwargs)
```

### 3. 即使在单继承中也使用 super()

即使是单继承，`super()` 也比直接调用父类更好：

```python
## 好的做法
class Child(Parent):
    def method(self):
        super().method()

## 避免
class Child(Parent):
    def method(self):
        Parent.method(self)  # 不够灵活
```

## 常见陷阱

### 1. 忘记调用 super()

```python
class Parent:
    def __init__(self, name):
        self.name = name

class Child(Parent):
    def __init__(self, name, age):
        # 忘记了 super().__init__(name)
        self.age = age  # self.name 不会被设置！
```

### 2. 参数传递错误

```python
class Parent:
    def __init__(self, name):
        self.name = name

class Child(Parent):
    def __init__(self, name, age):
        super().__init__()  # 缺少 'name' 参数！
        self.age = age
```

## 高级示例：钻石问题

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

## 使用
c = Child()
## 输出:
## Child init
## Left init
## Right init
## Base init
```

## 总结

- `super()` 提供对父类方法的访问
- 它对协作继承至关重要
- 始终使用 `super()` 而不是直接调用父类
- 在多重继承中理解 MRO
- 在继承链中保持方法签名的一致性
- 重写需要父类功能的方法时不要忘记调用 `super()`

正确使用 `super()` 使你的代码更易维护和灵活，特别是在复杂的继承层次结构中。
