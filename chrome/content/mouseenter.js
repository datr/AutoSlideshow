var xb =
{
	evtHash: [],

	ieGetUniqueID: function(_elem)
	{	if (_elem){
			if (_elem === window) { return 'theWindow'; }
			else if (_elem === document) { return 'theDocument'; }
			else { return _elem.uniqueID; }
		}
	},

	addEvent: function(_elem, _evtName, _fn, _useCapture)
	{
		if (_elem){
			if (typeof _elem.addEventListener != 'undefined')
			{
				if (_evtName == 'mouseenter')
					{ _elem.addEventListener('mouseover', xb.mouseEnter(_fn), _useCapture); }
				else if (_evtName == 'mouseleave')
					{ _elem.addEventListener('mouseout', xb.mouseEnter(_fn), _useCapture); } 
				else
					{ _elem.addEventListener(_evtName, _fn, _useCapture); }
			}
			else if (typeof _elem.attachEvent != 'undefined')
			{
				var key = '{FNKEY::obj_' + xb.ieGetUniqueID(_elem) + '::evt_' + _evtName + '::fn_' + _fn + '}';
				var f = xb.evtHash[key];
				if (typeof f != 'undefined')
					{ return; }
				
				f = function()
				{
					_fn.call(_elem);
				};
			
				xb.evtHash[key] = f;
				_elem.attachEvent('on' + _evtName, f);
		
				// attach unload event to the window to clean up possibly IE memory leaks
				window.attachEvent('onunload', function()
				{
					_elem.detachEvent('on' + _evtName, f);
				});
			
				key = null;
				//f = null;   /* DON'T null this out, or we won't be able to detach it */
			}
			else
				{ _elem['on' + _evtName] = _fn; }
		}
	},	

	removeEvent: function(_elem, _evtName, _fn, _useCapture)
	{
		if (_elem){
			if (typeof _elem.removeEventListener != 'undefined')
				{ _elem.removeEventListener(_evtName, _fn, _useCapture); }
			else if (typeof _elem.detachEvent != 'undefined')
			{
				var key = '{FNKEY::obj_' + xb.ieGetUniqueID(_elem) + '::evt' + _evtName + '::fn_' + _fn + '}';
				var f = xb.evtHash[key];
				if (typeof f != 'undefined')
				{
					_elem.detachEvent('on' + _evtName, f);
					delete xb.evtHash[key];
				}
			
				key = null;
				//f = null;   /* DON'T null this out, or we won't be able to detach it */
			}
				}
	},
	
	mouseEnter: function(_pFn)
	{
		return function(_evt)
		{
			var relTarget = _evt.relatedTarget;				
			if (this == relTarget || xb.isAChildOf(this, relTarget))
				{ return; }

			_pFn.call(this, _evt);
		}
	},
	
	isAChildOf: function(_parent, _child)
	{
		if (_parent == _child) { return false };
		
		while (_child && _child != _parent)
			{ _child = _child.parentNode; }
		
		return _child == _parent;
	}	
};