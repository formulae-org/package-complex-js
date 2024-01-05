/*
Fōrmulæ complex arithmetic package. Module for expression definition & visualization.
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

export class Complex extends Formulae.ExpressionPackage {};

Complex.setExpressions = function(module) {
	// literals
	[
		[ "Math.Complex",  "Imaginary", "ℹ" ]
	].forEach(row =>
		Formulae.setExpression(module, row[0] + "." + row[1], {
			clazz:      Expression.Literal,
			getTag:     () => row[0] + "." + row[1],
			getLiteral: () => row[2],
			getName:    () => Complex.messages["name" + row[1]],
		}
	));
	
	// superscripted literals
	Formulae.setExpression(module, "Math.Complex.Conjugate", {
		clazz:      Expression.SuperscriptedLiteral,
		getTag:     () => "Math.Complex.Conjugate",
		getLiteral: () => "*",
		getName:    () => Complex.messages.nameConjugate
	});
};
