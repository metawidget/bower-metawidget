// Metawidget 3.9.5-SNAPSHOT
//
// This file is dual licensed under both the LGPL
// (http://www.gnu.org/licenses/lgpl-2.1.html) and the EPL
// (http://www.eclipse.org/org/documents/epl-v10.php). As a
// recipient of Metawidget, you may choose to receive it under either
// the LGPL or the EPL.
//
// Commercial licenses are also available. See http://metawidget.org
// for details.

/**
 * Web Components wrapper for Metawidget.
 * 
 * @author <a href="http://kennardconsulting.com">Richard Kennard</a>
 */

var metawidget = metawidget || {};

( function( globalScope ) {

	'use strict';

	/**
	 * Use the value of the given HTML 5 attribute to lookup an object in the
	 * global scope. This includes traversing simple namespace paths such as
	 * 'foo.bar'
	 */

	function _lookupObject( attributeName ) {

		var attributeValue = this.getAttribute( attributeName );

		if ( attributeValue === null ) {
			return;
		}

		var typeAndNames = metawidget.util.splitPath( attributeValue );

		if ( typeAndNames === undefined ) {
			return;
		}

		var lookup = globalScope[typeAndNames.type];
		return metawidget.util.traversePath( lookup, typeAndNames.names );
	}

	/**
	 * Initialize an internal 'metawidget.Metawidget' object, that will be
	 * wrapped by this Web Component.
	 */

	function _initMetawidget() {

		new metawidget.Metawidget( this, _lookupObject.call( this, 'config' ) );
		this.buildWidgets();
	}

	/**
	 * Unobserves the currently observed 'path' (if any).
	 */

	function _unobserve() {

		if ( this.observer === undefined ) {
			return;
		}

		Object.unobserve( this.getMetawidget().toInspect, this.observer );
		this.observer = undefined;
	}

	if ( globalScope.document !== undefined && globalScope.document.registerElement !== undefined ) {

		var metawidgetPrototype = Object.create( HTMLElement.prototype );

		/**
		 * Upon attachedCallback, initialize an internal metawidget.Metawidget
		 * object using the current 'config' attribute (if any).
		 * <p>
		 * During initialization, a Metawidget will take a copy of any
		 * overridden child nodes, so this must be called after the document is
		 * ready.
		 */

		metawidgetPrototype.attachedCallback = function() {

			_initMetawidget.call( this );
		}

		/**
		 * If 'path', 'readonly' or 'config' are updated, rebuild the
		 * Metawidget.
		 */

		metawidgetPrototype.attributeChangedCallback = function( attrName, oldVal, newVal ) {

			switch ( attrName ) {
				case 'path':
					this.buildWidgets();
					break;
				case 'readonly':
					this.buildWidgets();
					break;
				case 'config':
					_initMetawidget();
					break;
			}
		}

		/**
		 * Rebuild the Metawidget, using the value of the current 'path'
		 * attribute.
		 */

		metawidgetPrototype.buildWidgets = function() {

			// Unobserve

			_unobserve.call( this );

			// Traverse and build

			var mw = this.getMetawidget();
			mw.toInspect = _lookupObject.call( this, 'path' );
			mw.readOnly = metawidget.util.isTrueOrTrueString( this.getAttribute( 'readonly' ) );
			mw.buildWidgets();

			// Observe for next time. toInspect may be undefined because
			// Metawidget can be used purely for layout

			if ( mw.toInspect !== undefined ) {

				var that = this;
				this.observer = function() {

					that.buildWidgets.call( that );
				}

				Object.observe( mw.toInspect, this.observer );
			}
		}

		/**
		 * Save the contents of the Metawidget using a SimpleBindingProcessor.
		 * <p>
		 * This is a convenience method. To access other Metawidget APIs,
		 * clients can use the 'getMetawidget' method. For example
		 * 'document.getElementById(...).getMeta.getWidgetProcessor(...)'
		 */

		metawidgetPrototype.save = function() {

			var mw = this.getMetawidget();

			mw.getWidgetProcessor( function( widgetProcessor ) {

				return widgetProcessor instanceof metawidget.widgetprocessor.SimpleBindingProcessor;
			} ).save( mw );
		}

		/**
		 * Upon detachedCallback, cleanup any observers.
		 */

		metawidgetPrototype.detachedCallback = function() {

			_unobserve.call( this );
		}

		// Register Metawidget as a Web Component

		globalScope.document.registerElement( 'x-metawidget', {
			prototype: metawidgetPrototype
		} );
	}
} )( this );
