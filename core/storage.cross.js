// Cross-browser cookie storage

d3.storage = 
{
	get: function(key, defaultValue)
	{
		try
		{
			var value = $j.cookie(key);
			if (value !== null)
				return d3.json.decode(value);
		} catch(e){}
		
		return defaultValue;
	},
	set: function(key, value)
	{
		if (!key || key == undefined) {
			if (console) console.log("Trying to save invalid cookie! ", value);
			return;
		}
        var domain = d3.content.domain || d3.content.variant;
		return $j.cookie(key, d3.json.encode(value), {domain: '.' + domain, path:'/', expires: 365});
	},
	remove: function(key)
	{
		return this.set(key, null);
	}
};