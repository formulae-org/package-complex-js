/*
Fōrmulæ complex arithmetic package. Module for expression definition & visualization.
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

export class Complex extends Formulae.ExpressionPackage {};

Complex.conjugateStyle = 0; // 0: x*   1: upper line


Complex.Conjugate = class extends Expression.SuperscriptedLiteral {
	getTag() {
		return "Math.Complex.Conjugate";
	}
	
	getLiteral() {
		return "*";
	}
	
	getName() {
		return Complex.messages.nameConjugate;
	}
	
	prepareDisplay(context) {
		if (Complex.conjugateStyle == 0) {
			super.prepareDisplay(context);
		}
		else {
			let child = this.children[0];
			child.prepareDisplay(context);
			
			this.width = child.width;
			this.height = 4 + child.height;
			
			this.horzBaseline = 4 + child.horzBaseline;
			this.vertBaseline = child.vertBaseline;
			
			child.x = 0;
			child.y = 4;
		}
	}
	
	display(context, x, y) {
		if (Complex.conjugateStyle == 0) {
			super.display(context, x, y);
		}
		else {
			let child = this.children[0];
			child.display(context, x + child.x, y + child.y);
			
			context.beginPath();
			context.moveTo(x, y + 0.0); context.lineTo(x + this.width, y + 0.0); // preventing obfuscation
			context.stroke();
		}
	}
}

Complex.setExpressions = function(module) {
	Formulae.setExpression(module, "Math.Complex.Conjugate", Complex.Conjugate);
	
	// literals
	[
		[ "Math.Complex",  "ImaginaryUnit", "ℹ" ]
	].forEach(row =>
		Formulae.setExpression(module, row[0] + "." + row[1], {
			clazz:      Expression.Literal,
			getTag:     () => row[0] + "." + row[1],
			getLiteral: () => row[2],
			getName:    () => Complex.messages["name" + row[1]],
		}
	));
	
	// superscripted literals
	/*
	Formulae.setExpression(module, "Math.Complex.Conjugate", {
		clazz:      Expression.SuperscriptedLiteral,
		getTag:     () => "Math.Complex.Conjugate",
		getLiteral: () => "*",
		getName:    () => Complex.messages.nameConjugate
	})
	*/;
};

Complex.isConfigurable = () => true;

Complex.onConfiguration = () => {
	let table = document.createElement("table");
	table.classList.add("bordered");
	let row = table.insertRow();
	let th = document.createElement("th"); th.setAttribute("colspan", "2"); th.appendChild(document.createTextNode(Complex.messages.labelComplex)); row.appendChild(th);
	row = table.insertRow();
	let col = row.insertCell();
	col.appendChild(document.createTextNode(Complex.messages.labelConjugateStyle));
	col = row.insertCell();
	
	let radio = document.createElement("input"); radio.type = "radio"; radio.addEventListener("click", () => Complex.onChangeConjugateStyle(0));
	col.appendChild(radio);
	
	let span = document.createElement("span");
	span.innerHTML = "x<sup>*</sup>";
	col.appendChild(span);
	
	col.appendChild(document.createElement("br"));
	col.appendChild(document.createElement("br"));
		
	radio = document.createElement("input"); radio.type = "radio"; radio.addEventListener("click", () => Complex.onChangeConjugateStyle(1));
	col.appendChild(radio);
	
	span = document.createElement("span");
	span.style = "text-decoration: overline;";
	span.innerHTML = "x";
	col.appendChild(span);
	
	Formulae.setModal(table);
};

Complex.onChangeConjugateStyle = function(pos) {
	Formulae.resetModal();
	
	Complex.conjugateStyle = pos;
	Formulae.refreshHandlers();
};
