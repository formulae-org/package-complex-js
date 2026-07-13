/*
Fōrmulæ complex arithmetic package. Module for edition.
Copyright (C) 2015-2026 Laurence R. Ugalde

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

"use strict";

export class Complex extends Formulae.EditionPackage {};

Complex.setEditions = function() {
	// Imaginary unit — replacing edition; plain-text symbol (like π, e, ∞)
	Formulae.addEdition(
		this.messages.pathComplex,
		"ℹ",
		this.messages.nameImaginaryUnit,
		() => Expression.replacingEdition("Math.Complex.ImaginaryUnit")
	);

	// Complex conjugate — wrapper edition; icon = Conjugate(▮)
	Formulae.addWrapperEditions(this.messages, "Complex", "Math.Complex", [ "Conjugate" ]);
};
