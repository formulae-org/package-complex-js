/*
Fōrmulæ complex arithmetic package. Module for reduction.
Copyright (C) 2015-2025 Laurence R. Ugalde

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
		
	a + bℹ*    ->   a - bℹ
	number*    ->   number   (decimal, integer or rational)
	(x + y)*   ->   x* + y*
	(x y)*     ->   x* y*
	(x ÷ y)*   ->   x* ÷ y*
	(-x)*      ->   -(x*)
 	(x*)*      ->   x
 */
 
Complex.conjugate = async (conjugate, session) => {
	let expr = conjugate.children[0];
	
	if (expr.isInternalNumber()) {
		let e = expr.get("Value");
		
		if (Arithmetic.isComplex(e)) {
			conjugate.replaceBy(Arithmetic.createInternalNumber(e.conjugate(), session));
			return true;
		}
		
		conjugate.replaceBy(expr);
		return true;
	}
	
	let tag = expr.getTag();
	switch (tag) {
		/*
		case "Math.Complex.ImaginaryUnit": {
			let result = Formulae.createExpression(
				"Math.Arithmetic.Multiplication",
				Arithmetic.number2InternalNumber(-1),
				e
			);
			conjugate.replaceBy(result);
			//session.log("Conjugate of a imaginary number");
			session.reduce(result);
			return true;
		}
		*/
		
		case "Math.Arithmetic.Addition":
		case "Math.Arithmetic.Multiplication":
		case "Math.Arithmetic.Division":
		case "Math.Arithmetic.Negative": {
			let conj;
			
			for (let i = 0, n = expr.children.length; i < n; ++i) {
				conj = Formulae.createExpression("Math.Complex.Conjugate");
				conj.addChild(expr.children[i]);
				expr.setChild(i, conj);
			}
			conjugate.replaceBy(expr);
			
			for (let i = 0, n = expr.children.length; i < n; ++i) await session.reduce(expr.children[i]);
			await session.reduce(expr);
			
			return true;
		}
		
		case "Math.Complex.Conjugate": {
			conjugate.replaceBy(expr.children[0]);
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

/*
Complex.productContainingI = async (multiplication, session) => {
	let pos, n = multiplication.children.length;
	let occurrences = 0;
	
	for (pos = 0; pos < n; ++pos) {
		if (multiplication.children[pos].getTag() === "Math.Complex.ImaginaryUnit") {
			occurrences = 1;
			break;
		}
	}
	
	// there was not any imaginary unit
	if (pos >= n) return false; // forward to other forms of Multiplication(...)
	
 	// there was, index is (pos)
	
	// performs multiplication with other numeric addends
	
	for (let i = n - 1; i > pos; --i) {
		if (multiplication.children[i].getTag() === "Math.Complex.ImaginaryUnit") {
			multiplication.removeChildAt(i);
			++occurrences;
		}
	}
	
	// only one occurrence
	if (occurrences === 1) return false;
	
	switch (occurrences % 4) {
		case 0:
			multiplication.children[pos].replaceBy(
				Arithmetic.canonical2InternalNumber(
					new Arithmetic.Integer(1n)
				)
			);
			break;
		
		case 1:
			// does noting, it is already the imaginary unit
			break;
		
		case 2:
			multiplication.children[pos].replaceBy(
				Arithmetic.canonical2InternalNumber(
					new Arithmetic.Integer(-1n)
				)
			);
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
	else {
		await session.reduce(multiplication);
	}
	
	return true;
};
*/

/**
	Returns
		If testing: Whether the given expression is a proportion of i
		If not testing: The proportion as a canonical number
	
	Examples (testing)
		i         ->   true
		-i        ->   true
		5i        ->   true
		-3i       ->   true
		2.5i      ->   true
		-8.0i     ->   true
		2/3 i     ->   true
		any other ->   false
	
	Examples (not testing)
		i       ->   Integer  1
		-i      ->   Integer -1
		5i      ->   Integer  5
		-3i     ->   Integer -3
		2.5i    ->   Decimal  2.5
		-8.0i   ->   Decimal -8.0
		2/3 i   ->   Rational 2/3
 */

/*
let proportionOfI = (expr, testing) => {
	let tag = expr.getTag();
	
	if (tag === "Math.Complex.ImaginaryUnit") return testing ? true : new Arithmetic.Integer(1);
	
	if (tag === "Math.Arithmetic.Multiplication") {
		if (expr.children.length !== 2) return false;
		
		if (expr.children[1].getTag() === "Math.Complex.ImaginaryUnit") {
			if (testing) {
				return expr.children[0].isInternalNumber();
			}
			else {
				return expr.children[0].get("Value");
			}
		}
	}
	
	return false;
};
*/

/**
	Groups proportions of I in an addition
	
	3i + 5.0i        ->   (3 + 5.0)I      ->   8.0i
	2.0 + x + 5/2i   ->   x + 4.5i
	3i - 3.0i        ->   0.0i            ->   0.0
	5 + 2i - 2i      ->   5 + (2 - 2)i    ->   5 + 0i   ->   5 + 0   ->   5
 */

/*
Complex.additionContainingI = async (addition, session) => {
	let pos, n = addition.children.length;
	
	for (pos = 0; pos < n; ++pos) {
		if (proportionOfI(addition.children[pos], true)) {
			break;
		}
	}
	
	// there was not any imaginary unit
	if (pos >= n) return false; // forward to other forms of addition
	
 	// there was, index is (pos)
	
	// performs addition with other numeric proportions
	
	let sum = null;
	
	for (let i = n - 1; i > pos; --i) {
		if (proportionOfI(addition.children[i], true)) {
			if (sum === null) {
				sum = proportionOfI(addition.children[pos], false);
			}
			
			sum = sum.addition(proportionOfI(addition.children[i], false), session);
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
			addition.children[0].replaceBy(
				Arithmetic.canonical2InternalNumber(sum)
			);
		}
	}
	else {
		//if (sum.isPositive()) {
			if (sum.isOne()) {
				let r = Formulae.createExpression("Math.Complex.ImaginaryUnit");
				addition.children[pos].replaceBy(r);
			}
			else {
				let r = Formulae.createExpression("Math.Arithmetic.Multiplication");
				r.addChild(
					Arithmetic.canonical2InternalNumber(sum)
				);
				r.addChild(Formulae.createExpression("Math.Complex.ImaginaryUnit"));
				addition.children[pos].replaceBy(r);
			}
		//}
		//else {
		//	sum = sum.negate();
		//	let r = Formulae.createExpression("Math.Arithmetic.Negative");
		//	if (sum.isOne()) {
		//		r.addChild(Formulae.createExpression("Math.Complex.ImaginaryUnit"))
		//		addition.children[pos].replaceBy(r);
		//	}
		//	else {
		//		let m = Formulae.createExpression("Math.Arithmetic.Multiplication");
		//		m.addChild(
		//			Arithmetic.canonical2InternalNumber(sum)
		//		);
		//		m.addChild(Formulae.createExpression("Math.Complex.ImaginaryUnit"));
		//		r.addChild(m);
		//		addition.children[pos].replaceBy(r);
		//	}
		//}
	}
	
	if (addition.children.length == 1) { // just one child
		addition.replaceBy(addition.children[0]);
	}
	
	return true;
};
*/

/**
	Returns
		If testing: Whether the given expression is a complex number of the form (number + [number] i)
		If not testing: Un array containing both the real and imaginary part, as canonical numbers
	
	Examples (testing)
		i         ->   true
		-i        ->   true
		5i        ->   true
		-3i       ->   true
		2.5i      ->   true
		-8.0i     ->   true
		2/3 i     ->   true
		any other ->   false
	
	Examples (not testing)
		i       ->   Integer  1
		-i      ->   Integer -1
		5i      ->   Integer  5
		-3i     ->   Integer -3
		2.5i    ->   Decimal  2.5
		-8.0i   ->   Decimal -8.0
		2/3 i   ->   Rational 2/3
 */

/*
let numericComplex = (expr, testing) => {
	// pure real
	if (expr.isInternalNumber()) {
		return testing ? true : [ expr.get("Value"), Arithmetic.number2Canonical(0) ];
	}
	
	let tag = expr.getTag();
	if (tag === "Math.Arithmetic.Addition") {
		if (expr.children.length !== 2) return false;
		
		if (proportionOfI(expr.children[1], true)) {
			if (testing) {
				return expr.children[0].isInternalNumber();
			}
			else {
				return [ expr.children[0].get("Value"), proportionOfI(expr.children[1], false) ]
			}
		}
	}
	else {
		// pure imaginary
		return testing ? proportionOfI(expr, true) : [ Arithmetic.number2Canonical(0), proportionOfI(expr, false) ];
	}
	
	return false;
};

Complex.division = async (division, session) => {
	let num = division.children[0];
	let den = division.children[1];
	
	if (!(numericComplex(num, true) && numericComplex(den, true))) return false;
	
	let a, b, c, d;
	{
		let n1 = numericComplex(num, false);
		let n2 = numericComplex(den, false);
		
		a = n1[0]; b = n1[1];
		c = n2[0]; d = n2[1];
	}
	
	let common = c.multiplication(c, session).addition(d.multiplication(d, session), session);
	
	let real = a.multiplication(c, session).addition(b.multiplication(d, session), session).division(common, session);
	let imag = b.multiplication(c, session).addition(a.negate().multiplication(d, session), session).division(common, session);
	
	let result = Arithmetic.createInternalComplex(real, imag);
	
	// let mult = Formulae.createExpression("Math.Arithmetic.Multiplication");
	// mult.addChild(Arithmetic.canonical2InternalNumber(imag));
	// mult.addChild(Formulae.createExpression("Math.Complex.ImaginaryUnit"))
	
	// let result = Formulae.createExpression("Math.Arithmetic.Addition");
	//result.addChild(Arithmetic.canonical2InternalNumber(real));
	// result.addChild(mult);
	
	division.replaceBy(result);
	return true;
};

Complex.exponentiation = async (exponentiation, session) => {
	let base = exponentiation.children[0];
	let exponent = exponentiation.children[1];
	
	if (!(numericComplex(base, true) && numericComplex(exponent, true))) return false;
	
	let a, b, c, d;
	{
		let n1 = numericComplex(base, false);
		let n2 = numericComplex(exponent, false);
		
		a = n1[0]; b = n1[1];
		c = n2[0]; d = n2[1];
	}
	
	// special case
	
	console.log("a.isZero: " + a.isZero());
	console.log("d.isZero: " + d.isZero());
	console.log("c.hasIntegerValue: " + c.hasIntegerValue());
	
	if (
		a.isZero() &&
		d.isZero() &&
		c.hasIntegerValue()
	) {
		let factor = b.exponentiation(c, session);
		console.log(factor);
		
		if (c instanceof Arithmetic.Decimal) {
			c = new Arithmetic.Integer(c.decimal.toFixed());
		}
		
		let expr;
		
		switch (c.integer % 4n) {
			case 0n:
				expr = Arithmetic.canonical2InternalNumber(factor);
				break;
			
			case 1n:
			case -3n:
				expr = Arithmetic.createInternalComplex(
					Arithmetic.INTEGER_ZERO,
					factor,
					session
				);
				
				//if (factor.isOne()) {
				//	expr = Formulae.createExpression("Math.Complex.ImaginaryUnit");
				//}
				//else {
				//	expr = Formulae.createExpression(
				//		"Math.Arithmetic.Multiplication",
				//		Arithmetic.canonical2InternalNumber(factor),
				//		Formulae.createExpression("Math.Complex.ImaginaryUnit")
				//	);
				//}
				break;
			
			case 2n:
			case -2n:
				factor = factor.negate();
				expr = Arithmetic.canonical2InternalNumber(factor);
				break;
			
			case 3n:
			case -1n:
				factor = factor.negate();
				expr = Arithmetic.createInternalComplex(
					Arithmetic.INTEGER_ZERO,
					factor,
					session
				);
				
				//if (factor.isOne()) {
				//	expr = expr = Formulae.createExpression("Math.Complex.ImaginaryUnit");
				//}
				//else {
				//	expr = Formulae.createExpression(
				//		"Math.Arithmetic.Multiplication",
				//		Arithmetic.canonical2InternalNumber(factor),
				//		Formulae.createExpression("Math.Complex.ImaginaryUnit")
				//	);
				//}
				break;
		}
		
		exponentiation.replaceBy(expr);
		return true;
	}
	
	// decimal
	
	if (
		a instanceof Arithmetic.Decimal ||
		b instanceof Arithmetic.Decimal ||
		c instanceof Arithmetic.Decimal ||
		d instanceof Arithmetic.Decimal
	) {
		if (!(a instanceof Arithmetic.Decimal)) a = a.toDecimal(session);
		if (!(b instanceof Arithmetic.Decimal)) b = b.toDecimal(session);
		if (!(c instanceof Arithmetic.Decimal)) c = c.toDecimal(session);
		if (!(d instanceof Arithmetic.Decimal)) d = d.toDecimal(session);
		
		a = a.decimal;
		b = b.decimal;
		c = c.decimal;
		d = d.decimal;
		
		let r = session.Decimal.sqrt(
			session.Decimal.add(
				session.Decimal.mul(a, a),
				session.Decimal.mul(b, b)
			)
		);
		let angle = session.Decimal.atan2(b, a)
		let f = session.Decimal.mul(
			session.Decimal.pow(r, c),
			session.Decimal.exp(
				session.Decimal.mul(
					d.neg(),
					angle
				)
			)
		);
		let arg = session.Decimal.add(
			session.Decimal.mul(
				d,
				session.Decimal.ln(r)
			),
			session.Decimal.mul(c, angle)
		);
		let re = session.Decimal.mul(
			f,
			session.Decimal.cos(arg)
		);
		let im = session.Decimal.mul(
			f,
			session.Decimal.sin(arg)
		);
		
		exponentiation.replaceBy(
			Formulae.createExpression(
				"Math.Arithmetic.Addition",
				Arithmetic.number2InternalNumber(re, true, session),
				Formulae.createExpression(
					"Math.Arithmetic.Multiplication",
					Arithmetic.number2InternalNumber(im, true, session),
					Formulae.createExpression("Math.Complex.ImaginaryUnit")
				)
			)
		);
		return true;
	}
	
	// closed form
	
	let symbolR = Formulae.createExpression("Symbolic.Symbol");
	symbolR.set("Name", "r");
	
	let symbolAngle = Formulae.createExpression("Symbolic.Symbol");
	symbolAngle.set("Name", "θ");
	
	let symbolF = Formulae.createExpression("Symbolic.Symbol");
	symbolF.set("Name", "f");
	
	let symbolArg = Formulae.createExpression("Symbolic.Symbol");
	symbolArg.set("Name", "arg");
	
	let block = Formulae.createExpression(
		"Programming.Block",
		Formulae.createExpression(
			"Symbolic.Local",
			Formulae.createExpression(
				"Symbolic.Assignment",
				symbolR.clone(),
				Formulae.createExpression(
					"Math.Arithmetic.SquareRoot",
					Arithmetic.canonical2InternalNumber(
						a.multiplication(a, session).addition(b.multiplication(b, session), session)
					)
				)
			)
		),
		Formulae.createExpression(
			"Symbolic.Local",
			Formulae.createExpression(
				"Symbolic.Assignment",
				symbolAngle.clone(),
				Formulae.createExpression(
					"Math.Trigonometric.ArcTangent2",
					Arithmetic.canonical2InternalNumber(b),
					Arithmetic.canonical2InternalNumber(a)
				)
			)
		),
		Formulae.createExpression(
			"Symbolic.Local",
			Formulae.createExpression(
				"Symbolic.Assignment",
				symbolF.clone(),
				Formulae.createExpression(
					"Math.Arithmetic.Multiplication",
					Formulae.createExpression(
						"Math.Arithmetic.Exponentiation",
						symbolR.clone(),
						Arithmetic.canonical2InternalNumber(c)
					),
					Formulae.createExpression(
						"Math.Arithmetic.Exponentiation",
						Formulae.createExpression("Math.Constant.Euler"),
						Formulae.createExpression(
							"Math.Arithmetic.Multiplication",
							Arithmetic.number2InternalNumber(-1),
							Arithmetic.canonical2InternalNumber(d),
							symbolAngle.clone()
						)
					)
				)
			)
		),
		Formulae.createExpression(
			"Symbolic.Local",
			Formulae.createExpression(
				"Symbolic.Assignment",
				symbolArg.clone(),
				Formulae.createExpression(
					"Math.Arithmetic.Addition",
					Formulae.createExpression(
						"Math.Arithmetic.Multiplication",
						Arithmetic.canonical2InternalNumber(d),
						Formulae.createExpression(
							"Math.Transcendental.NaturalLogarithm",
							symbolR.clone()
						)
					),
					Formulae.createExpression(
						"Math.Arithmetic.Multiplication",
						Arithmetic.canonical2InternalNumber(c),
						symbolAngle.clone()
					)
				)
			)
		),
		Formulae.createExpression(
			"Math.Arithmetic.Addition",
			Formulae.createExpression(
				"Math.Arithmetic.Multiplication",
				symbolF.clone(),
				Formulae.createExpression(
					"Math.Trigonometric.Cosine",
					symbolArg.clone()
				)
			),
			Formulae.createExpression(
				"Math.Arithmetic.Multiplication",
				symbolF.clone(),
				Formulae.createExpression(
					"Math.Trigonometric.Sine",
					symbolArg.clone()
				),
				Formulae.createExpression("Math.Complex.ImaginaryUnit")
			)
		)
	);
	
	exponentiation.replaceBy(block);
	await session.reduce(block);
	return true;
};
*/

Complex.setReducers = () => {
	ReductionManager.addReducer("Math.Complex.Conjugate", Complex.conjugate, "Complex.conjugate");
	
	//ReductionManager.addReducer("Math.Arithmetic.Multiplication", Complex.productContainingI,  "Complex.productContainingI");
	//ReductionManager.addReducer("Math.Arithmetic.Addition",       Complex.additionContainingI, "Complex.additionContainingI");
	//ReductionManager.addReducer("Math.Arithmetic.Division",       Complex.division,            "Complex.division");
	//ReductionManager.addReducer("Math.Arithmetic.Exponentiation", Complex.exponentiation,      "Complex.exponentiation");
};

