<script context="module">

export function HttpExecutor(api, method){
	
	return fetch(api,{
				method : 'GET'
			})
			.then(res => res.json())
			.then(data => {
		  		return data;
			})
			.catch(err => {
		    	return err;       
			});
}

async function HttpRequest(api, method){
	
	try{
		const data = await httpExecutor();
		return data;
	}

	catch(err){
		return err;
	}

}

</script>