/*
Fōrmulæ complex arithmetic package. Module for reduction.
Copyright (C) 2015-2023 Laurence R. Ugalde

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

'use strict';

export class Complex extends Formulae.ReductionPackage {};

/**
	Complex conjugate of an expression
		
	number*    ->   number   (decimal, integer or rational)
	ℹ*         ->   ℹ
	(x + y)*   ->   x* + y*
	(x y)*     ->   x* y*
	(x ÷ y)*   ->   x* ÷ y*
	(-x)*      ->   -(x*)
 	(x*)*      ->   x
 */
 
Complex.conjugate = async (conjugate, session) => {
	let e = conjugate.children[0];
	
	if (CanonicalArithmetic.isExpressionCanonicalNumeric(e)) {
		conjugate.replaceBy(e);
		//session.log("Conjugate of a number is the same number");
		return true;
	}
	
	let tag = e.getTag();
	switch (tag) {
		case "Math.Complex.Imaginary": {
			let result = Formulae.createExpression("Math.Arithmetic.Negative");
			result.addChild(e);
			conjugate.replaceBy(result);
			//session.log("Conjugate of a imaginary number");
			session.reduce(result);
			return true;
		}
		
		case "Math.Arithmetic.Addition":
		case "Math.Arithmetic.Multiplication":
		case "Math.Arithmetic.Division":
		case "Math.Arithmetic.Negative": {
			let conj;
			
			for (let i = 0, n = e.children.length; i < n; ++i) {
				conj = Formulae.createExpression("Math.Complex.Conjugate");
				conj.addChild(e.children[i]);
				e.setChild(i, conj);
			}
			conjugate.replaceBy(e);
			//session.log("Conjugation of basic operations");
			
			for (let i = 0, n = e.children.length; i < n; ++i) await session.reduce(e.children[i]);
			await session.reduce(e);
			
			return true;
		}
		
		case "Math.Complex.Conjugate": {
			conjugate.replaceBy(e.children[0]);
			//session.log("Conjugate of a conjugate is cancelled");
			return true;
		}
	}
	
	return false;
};

/**
	Searches for imaginary unit in a multiplication
	If more than one found, subsitutes them by i, -i, 1 or -1
 */

Complex.productContainingI = async (multiplication, session) => {
	let pos, n = multiplication.children.length;
	let occurrences = 0;
	
	for (pos = 0; pos < n; ++pos) {
		if (multiplication.children[pos].getTag() === "Math.Complex.Imaginary") {
			occurrences = 1;
			break;
		}
	}
	
	// there was not any imaginary unit
	if (pos >= n) return false; // forward to other forms of Multiplication(...)
	
 	// there was, index is (pos)
	
	// performs multiplication with other numeric addends
	
	for (let i = n - 1; i > pos; --i) {
		if (multiplication.children[i].getTag() === "Math.Complex.Imaginary") {
			multiplication.removeChildAt(i);
			++occurrences;
		}
	}
	
	// only one occurrence
	if (occurrences === 1) return false;
	
	switch (occurrences % 4) {
		case 0:
			multiplication.children[pos].replaceBy(CanonicalArithmetic.number2Expr(1));
			break;
		
		case 1:
			// does noting, it is already the imaginary unit
			break;
		
		case 2:
			multiplication.children[pos].replaceBy(CanonicalArithmetic.number2Expr(-1));
			break;
		
		case 3: {
				let neg = Formulae.createExpression("Math.Arithmetic.Negative");
				let i = multiplication.children[pos];
				multiplication.setChild(pos, neg);
				neg.addChild(i);
			}
			break;
	}
	
	if (multiplication.children.length == 1) { // just one child
		multiplication.replaceBy(multiplication.children[0]);
	}
	
	return true;
};

let containsI = (expr, testing) => {
	let negative = false;
	let tag = expr.getTag();
	
	if (tag === "Math.Complex.Imaginary") return testing ? true : new CanonicalArithmetic.Integer(1);
	
	if (tag === "Math.Arithmetic.Negative") {
		expr = expr.children[0];
		tag = expr.getTag();
		if (tag === "Math.Complex.Imaginary") return testing ? true : new CanonicalArithmetic.Integer(-1);
		negative = true;
	}
	
	if (tag === "Math.Arithmetic.Multiplication") {
		if (expr.children.length !== 2) return false;
		
		if (expr.children[0].getTag() === "Math.Complex.Imaginary") {
			if (testing) {
				return CanonicalArithmetic.isExpressionCanonicalNumeric(expr.children[1]);
			}
			else {
				let n = CanonicalArithmetic.expr2CanonicalNumeric(expr.children[1]);
				if (negative) n = n.negate();
				return n;
			}
		}
		
		if (expr.children[1].getTag() === "Math.Complex.Imaginary") {
			if (testing) {
				return CanonicalArithmetic.isExpressionCanonicalNumeric(expr.children[0]);
			}
			else {
				let n = CanonicalArithmetic.expr2CanonicalNumeric(expr.children[0]);
				if (negative) n = n.negate();
				return n;
			}
		}
	}
	
	return false;
};

Complex.additionContainingI = async (addition, session) => {
	let pos, n = addition.children.length;
	
	for (pos = 0; pos < n; ++pos) {
		if (containsI(addition.children[pos], true)) {
			break;
		}
	}
	
	// there was not any imaginary unit
	if (pos >= n) return false; // forward to other forms of Multiplication(...)
	
 	// there was, index is (pos)
	
	// performs addition with other numeric proportions
	
	let sum = null;
	
	for (let i = n - 1; i > pos; --i) {
		if (containsI(addition.children[i], true)) {
			if (sum === null) {
				sum = containsI(addition.children[pos], false);
			}
			
			sum = sum.addition(containsI(addition.children[i], false), session);
			addition.removeChildAt(i);
		}
	}
	
	// were there changes ?
	if (sum === null) return false;
	
	if (sum.isZero()) {
		if (addition.children.length >= 2) {
			addition.removeChildAt(pos);
		}
		else {
			let r = CanonicalArithmetic.canonicalNumeric2Expr(sum);
			addition.children[0].replaceBy(r);
		}
	}
	else {
		if (sum.isPositive()) {
			if (sum.isOne()) {
				let r = Formulae.createExpression("Math.Complex.Imaginary");
				addition.children[pos].replaceBy(r);
			}
			else {
				let r = Formulae.createExpression("Math.Arithmetic.Multiplication");
				r.addChild(CanonicalArithmetic.canonicalNumeric2Expr(sum));
				r.addChild(Formulae.createExpression("Math.Complex.Imaginary"));
				addition.children[pos].replaceBy(r);
			}
		}
		else {
			sum = sum.negate();
			let r = Formulae.createExpression("Math.Arithmetic.Negative");
			if (sum.isOne()) {
				r.addChild(Formulae.createExpression("Math.Complex.Imaginary"))
				addition.children[pos].replaceBy(r);
			}
			else {
				let m = Formulae.createExpression("Math.Arithmetic.Multiplication");
				m.addChild(CanonicalArithmetic.canonicalNumeric2Expr(sum));
				m.addChild(Formulae.createExpression("Math.Complex.Imaginary"));
				r.addChild(m);
				addition.children[pos].replaceBy(r);
			}
		}
	}
	
	if (addition.children.length == 1) { // just one child
		addition.replaceBy(addition.children[0]);
	}
	
	return true;
};

Complex.setReducers = () => {
	ReductionManager.addReducer("Math.Complex.Conjugate",         Complex.conjugate,           "Complex.conjugate");
	ReductionManager.addReducer("Math.Arithmetic.Multiplication", Complex.productContainingI,  "Complex.productContainingI");
	ReductionManager.addReducer("Math.Arithmetic.Addition",       Complex.additionContainingI, "Complex.additionContainingI");
};
