---
title: 'Pythonで`super()`を使う方法'
pubDate: 2025-01-31T00:00:00.000Z
description: 'Python継承における super() 関数の使い方を学ぶ'
author: 'Remy'
tags: ['python', '継承', 'オブジェクト指向プログラミング', 'super']
lang: 'ja'
translatedFrom: 'How-to-Use-super-in-Python'
---

`super()`は、Pythonの組み込み関数で、親クラスまたは兄弟クラスのメソッドを呼び出すことができます。継承シナリオで特に有用で、親クラスのコードを再利用しながら機能を拡張できます。

## 基本構文

```python
super(type, object).method(*args, **kwargs)
```

Python 3では、次のように簡略化できます：

```python
super().method(*args, **kwargs)
```

## 一般的な使用例

### 1. 親クラスのメソッドを拡張する

最も一般的な使用例は、親クラスのメソッドを拡張しつつ、その機能を引き続き使用することです：

```python
class Parent:
    def greet(self):
        return "Hello from Parent!"

class Child(Parent):
    def greet(self):
        parent_greeting = super().greet()  # 親クラスのメソッドを呼び出す
        return f"{parent_greeting} And hello from Child too!"
```

### 2. 親クラスの初期化

`__init__`メソッドで非常によく使われ、適切な初期化を保証します：

```python
class Animal:
    def __init__(self, name):
        self.name = name
        print(f"Animal {name} created")

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)  # 親クラスを初期化
        self.breed = breed
        print(f"Dog {name} of breed {breed} created")

# 使用例
my_dog = Dog("Buddy", "Golden Retriever")
# 出力:
# Animal Buddy created
# Dog Buddy of breed Golden Retriever created
```

### 3. 多重継承

`super()`は多重継承においてより複雑になりますが、非常に強力です：

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

# 使用例
d = D()
d.method()
# 出力:
# D's method
# B's method
# C's method
# A's method
```

## メソッド解決順序 (MRO)

多重継承で`super()`を使用する際、MRO（Method Resolution Order）を理解することが極めて重要です：

```python
class D(B, C):
    pass

print(D.__mro__)
# (<class '__main__.D'>, <class '__main__.B'>, <class '__main__.C'>, <class '__main__.A'>, <class 'object'>)
```

## ベストプラクティス

### 1. 協調継承では常にsuper()を使用する

```python
# 良い方法
class Parent:
    def __init__(self, value):
        self.value = value

class Child(Parent):
    def __init__(self, value, extra):
        super().__init__(value)  # 協調的
        self.extra = extra
```

### 2. 引数の一貫性を保つ

`super()`を使用する際は、継承チェーン内のすべてのメソッドが互換性のあるシグネチャを持つようにします：

```python
class A:
    def method(self, *args, **kwargs):
        print("A's method")

class B(A):
    def method(self, *args, **kwargs):
        print("B's method")
        super().method(*args, **kwargs)
```

### 3. 単一継承でもsuper()を使用する

単一継承でも、`super()`は親クラスを直接呼び出すよりも優れています：

```python
# 良い方法
class Child(Parent):
    def method(self):
        super().method()

# 避けるべき
class Child(Parent):
    def method(self):
        Parent.method(self)  # 柔軟性に欠ける
```

## よくある落とし穴

### 1. super()の呼び出しを忘れる

```python
class Parent:
    def __init__(self, name):
        self.name = name

class Child(Parent):
    def __init__(self, name, age):
        # super().__init__(name) を忘れた
        self.age = age  # self.name は設定されない！
```

### 2. 引数の渡し間違い

```python
class Parent:
    def __init__(self, name):
        self.name = name

class Child(Parent):
    def __init__(self, name, age):
        super().__init__()  # 'name' 引数が不足！
        self.age = age
```

## 高度な例：ダイヤモンド問題

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

# 使用例
c = Child()
# 出力:
# Child init
# Left init
# Right init
# Base init
```

## まとめ

- `super()`は親クラスのメソッドへのアクセスを提供します
- 協調継承において極めて重要です
- 親クラスを直接呼び出すのではなく、常に`super()`を使用すべきです
- 多重継承ではMROを理解する必要があります
- 継承チェーン全体でメソッドシグネチャの一貫性を保ちます
- 親クラスの機能が必要なメソッドをオーバーライドする際、`super()`の呼び出しを忘れないようにします

`super()`を正しく使用することで、コードがより保守しやすく柔軟になり、特に複雑な継承階層において効果を発揮します。
