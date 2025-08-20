---
title: 'How to Understand "Linearity" in Linear Algebra?'
pubDate: 2025-02-01T00:00:00.000Z
description: 'How to understand "linearity" in linear algebra?'
author: 'Remy'
tags: ['linear-algebra', 'mathematics', 'linearity', 'education']
---

In mathematics, the concept of "linearity" runs through the entire field of linear algebra. But what is linearity? Why is it so important? Let's deeply understand this concept from several perspectives.

## Intuitive Understanding

The simplest way to understand is through straight lines. In a plane coordinate system, functions of the form y = ax + b have straight line graphs. When b = 0, this line passes through the origin, and the function y = ax is a linear function.
Linear functions have two important properties:
1. Additivity: $f(x_1 + x_2) = f(x_1) + f(x_2)$
2. Homogeneity: $f(cx) = cf(x)$, where $c$ is any constant

Analogical explanation:
- Additivity: The combined effect of two inputs equals the sum of their individual effects. Like pouring two cups of water together, the total amount is the sum of both, with no mysterious loss or gain.
- Homogeneity: If you magnify the input by n times, the output will also be magnified by n times. Like a volume knob on a speaker, turning it twice makes the sound twice as loud.

Homogeneity can be understood more intuitively. When c is an integer, say c = 3, then:

$f(3x) = f(x + x + x) = f(x) + f(x) + f(x) = 3f(x)$

This shows that homogeneity is actually a natural extension of additivity in the real number domain. We first understand homogeneity through integer multiples (adding multiple identical elements), then extend this concept to any real number. This extension allows linear transformations to maintain good properties in the continuous real number domain.

## Mathematical Definition

In linear algebra, a linear transformation is a function that preserves vector addition and scalar multiplication. Specifically, for a linear transformation $L$, it must satisfy:

1. $L(\vec{v} + \vec{w}) = L(\vec{v}) + L(\vec{w})$  (Addition preservation)
2. $L(c\vec{v}) = cL(\vec{v})$  (Scalar multiplication preservation)

These two properties are actually the generalization of the additivity and homogeneity we mentioned earlier.

## Why is Linearity Important?

1. **Simplicity**: Linear relationships are among the simplest mathematical relationships, easy to understand and calculate.

2. **Composability**: The composition of linear transformations is still a linear transformation, allowing us to decompose complex problems into simpler parts.

3. **Wide Applications**:
   - In physics: Many fundamental laws (like Hooke's law) are linear, essentially because physical systems respond proportionally to inputs within small ranges
   - In economics: Marginal effects are often assumed to be linear relationships, essentially because the rate of change between economic variables remains constant within local ranges
   - In machine learning: Linear regression is one of the most basic models, essentially assuming linear correlation between features and target variables

## What Exactly is a Matrix?

A matrix is a core concept in linear algebra that represents linear transformations as numerical tables. Specifically, a matrix is a rectangular array of numbers. For example:

$$ 
A = \begin{bmatrix} 
2 & 1 \\
3 & 4
\end{bmatrix} 
$$

This 2×2 matrix can be viewed as a linear transformation that maps every point $(x,y)$ on the plane to a new point:

$$ 
\begin{bmatrix}
2 & 1 \\
3 & 4
\end{bmatrix} 
\begin{bmatrix}
x \\
y
\end{bmatrix} = 
\begin{bmatrix}
2x + y \\
3x + 4y
\end{bmatrix} 
$$

The importance of matrices lies in:

1. **Representation of Linear Transformations**: Any linear transformation can be represented by a matrix
2. **Computational Efficiency**: Matrix operations make complex linear transformations simple and systematic
3. **Composability**: The composition of multiple linear transformations can be achieved through matrix multiplication

From a geometric perspective, each column of a matrix can be viewed as the position of basis vectors after transformation. For example, in the above matrix:
- The first column [2,3]ᵀ represents the position of unit vector [1,0]ᵀ after transformation
- The second column [1,4]ᵀ represents the position of unit vector [0,1]ᵀ after transformation

### Matrix Multiplication

The essence of matrix multiplication is like chaining a series of spatial transformations. Imagine matrices as tools for manipulating space, where each matrix can rotate, scale, or distort elements in space. When we multiply two matrices, we're essentially applying one transformation after another, letting their effects stack up.

For analogy, suppose you're using a filter app. The first filter makes the photo black and white, the second filter adds a blur effect. If you apply the black and white filter first, then the blur filter, the result is the same as directly applying a filter that has both effects simultaneously. Matrix multiplication is creating this kind of "combined filter," merging multiple transformations into a new, more complex transformation.

From an algebraic perspective, matrix multiplication is calculated through inner products of rows and columns, reflecting interactions between different dimensions. Geometrically, this means we can describe complex spatial operations, like rotating an object first then scaling it.

Matrix multiplication doesn't satisfy the commutative property, meaning the order of transformations is crucial. Rotating first then translating, versus translating first then rotating, can yield completely different results.

```
[vector] --(Matrix A)--> [Transform 1] --(Matrix B)--> [Transform 2]

Equivalent to:

[vector] --(Matrix B × Matrix A)--> [Transform 2]

But usually:

Matrix B × Matrix A ≠ Matrix A × Matrix B
```

This importance of order has far-reaching implications in practical applications. For instance, in robot motion control, the sequence of joint rotations and displacements directly affects the end effector's position. In computer graphics, the order of transformations on 3D models changes the final rendered image.

## The Essence of Determinants

The determinant is an important concept in linear algebra that connects matrices with geometric properties of space. The essence of determinants is:

1. **Area/Volume Scaling Factor**:
   - For 2x2 matrices, the determinant represents the area scaling ratio of the transformed parallelogram
   - For 3x3 matrices, the determinant represents the volume scaling ratio of the transformed parallelepiped
   - More simply, the determinant represents the area/volume of a unit square/cube after transformation.

2. **Properties of Determinants**:
   - The determinant of an identity matrix is naturally 1
   - A determinant with any row of all zeros is obviously 0 (because one dimension is ignored, the linear transformation flattens the entire plane)
   - |A·B| obviously equals |A|·|B|

3. **Properties of Determinants**:
   - A matrix with determinant 0 corresponds to a linear transformation that has flattened the plane into a line, and nothing can transform it back. Therefore, matrices with determinant 0 are not invertible.

Suddenly, everything is explained clearly.

## What Does Non-linearity Look Like?

To better understand linearity, we can also look at examples of non-linearity:
- $y = x^2$ (parabola)
- $y = sin(x)$ (trigonometric function)
- $y = e^x$ (exponential function)

These functions don't satisfy additivity and homogeneity, so they are non-linear.
Let's use $y = x^2$ as an example to show why it doesn't satisfy linear properties:

1. Doesn't satisfy additivity:
   $f(x_1 + x_2) = (x_1 + x_2)^2 = x_1^2 + 2x_1x_2 + x_2^2$
   While $f(x_1) + f(x_2) = x_1^2 + x_2^2$
   Obviously $(x_1 + x_2)^2 \neq x_1^2 + x_2^2$, because of the extra cross term $2x_1x_2$

2. Doesn't satisfy homogeneity:
   $f(cx) = (cx)^2 = c^2x^2$
   While $cf(x) = c(x^2)$
   Obviously $c^2x^2 \neq cx^2$, because the powers of $c$ are different

Similarly, we can verify other non-linear functions:
- For $sin(x)$: $sin(x_1 + x_2) \neq sin(x_1) + sin(x_2)$
- For $e^x$: $e^{x_1 + x_2} = e^{x_1}e^{x_2} \neq e^{x_1} + e^{x_2}$

The relationship between output and input for these functions is more complex and cannot be simply represented through linear combinations.

## Geometric Understanding

Core: A straight line remains a straight line after linear transformation.

This statement reveals an important geometric property of linear transformations. Let's understand through specific examples:

1. Rotation transformation
   - Suppose we have a straight line y = 2x
   - Rotating it counterclockwise by 45 degrees around the origin can be represented by a matrix:
     $$ 
     \begin{bmatrix} 
     \cos 45° & -\sin 45° \\ 
     \sin 45° & \cos 45° 
     \end{bmatrix} = 
     \begin{bmatrix} 
     \frac{\sqrt{2}}{2} & -\frac{\sqrt{2}}{2} \\ 
     \frac{\sqrt{2}}{2} & \frac{\sqrt{2}}{2} 
     \end{bmatrix} 
     $$
   - After transformation, we still get a straight line, with slope changing from 2 to $\frac{2\cos 45° + \sin 45°}{\cos 45° - 2\sin 45°}=-3$
   - This matrix transformation preserves the linear property of the line

2. Scaling transformation
   - Consider the line y = 3x
   - Scaling by 2 times in x-direction and 3 times in y-direction
   - The result is still a straight line, just with slope changing from 3 to 4.5

3. Shear transformation
   - Apply horizontal shear transformation to line x = 2
   - After transformation, it becomes x = 2 + ky, where k is the shear coefficient
   - Still maintains the straight line property

This property is particularly important in computer graphics:
- In image processing, linear transformations can maintain the "straightness" of straight lines
- In 3D modeling, object edges remain straight after rotation, scaling, and other linear transformations

This also explains why linear transformations are so practical in geometric transformations - they can preserve basic shape characteristics.

## Summary

Linearity is one of the most fundamental and beautiful concepts in mathematics. It not only simplifies our calculations but also provides a foundation for understanding more complex mathematical concepts. In practical applications, although the world is non-linear, linear approximations are often our first step in understanding and solving problems.

The key to understanding "linearity" lies in:
1. Grasping its core properties: additivity and homogeneity
2. Recognizing its ubiquitous presence
3. Understanding its value as a simplification tool

Through these understandings, we can better comprehend why linear algebra occupies such an important position in modern mathematics and applied sciences.
