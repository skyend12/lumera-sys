<script type="text/javascript">

	import {onMount} from 'svelte'
	import {Link} from 'svelte-routing'

	export let formController;

	onMount(async => {

	});

	function post_request(){

		let validation = 0;
		let temporary_get_gate="?"; 

		for(let i = 0; i < formController.forms.length; i++){
			
			if(formController.forms[i].required == true){

				if(formController.forms[i].text == "" || 
				   formController.forms[i].text == undefined ||
				   formController.forms[i].text == "undefined" ||
				   formController.forms[i].text == "-PILIH-"){
					validation = 0;
					alert("Anda harus melengkapi semua form yang bertanda *");
					break;
				}

				else{
					validation = 1;
				}
			}

			else{
				validation = 1;
			}

			if(validation == 1){

				if(i == (formController.forms.length - 1)){
					temporary_get_gate = temporary_get_gate + "data_" + i + "=" + formController.forms[i].text;
				}
				else{
					temporary_get_gate = temporary_get_gate + "data_" + i + "=" + formController.forms[i].text + "&";
				}
				
			}

		}

		if(validation == 1){
			httpRequest(formController + temporary_get_gate);
		}
	}

	function httpRequest(api){

		fetch(api, {
	        method : 'GET'
	    }).then(res => res.json())

	    .then(data => { 
	      data_raw = data;
	      console.log(data_raw);
	    })

	    .catch(err => {
	           
	    })
	}

</script>

<style type="scss">
	
</style>

<div class="container">

	<!-- header -->
	<section class="content-header">
	    <div class="container-fluid">
	      <div class="row mb-2">
	        <div class="col-sm-6">
	          <h1></h1>
	        </div>
	        <div class="col-sm-6">
	          <ol class="breadcrumb float-sm-right">
	          	{#each formController.breadcrumb as bread}
	          		<li class="breadcrumb-item"><Link to = "{bread.link}">{bread.value}</Link></li>
	          	{/each}
	            <li class="breadcrumb-item active">{formController.header.title}</li>
	          </ol>
	        </div>
	      </div>
	    </div>
  	</section>

	<section class="content">
    	<div class="container-fluid">
      		<div class="row">
        		<!-- left column -->
        		<div class="col-md-12">
          		<!-- general form elements -->
          			<div class="card card-primary card-outline">

            			<div class="card-header mb-2">
              				<h5 class="mt-1 mb-0"><i class="{formController.header.icon} mr-2"></i>{formController.header.title}</h5>
              				<div style="position: absolute;right: 20px;top: 18px">
              				<Link to="{formController.breadcrumb[formController.breadcrumb.length - 1].link}"><p class="btn btn-danger">BATAL</p></Link></div>
            			</div>
              
              			<form on:submit|preventDefault={post_request} class="mt-3">
                		
                			{#each formController.forms as input}

                			<div class="form-group col-md-12 ml-1 mr-1">
                				<label for="service important-form">
                					{input.label}
                					{#if input.required == true}
                						<span style="color: red">*</span>
                					{/if}
                				</label>
                			
                			<!-- input text -->
                			{#if input.type == "text"}                  		
						        <input type="text" required="{input.required}" bind:value={input.text} class="form-control" id="service" placeholder={input.placeholder}>

						    <!-- input number -->
						    {:else if input.type == "number"}
						    	<input type="number" required="{input.required}" bind:value={input.text} class="form-control" id="service" placeholder={input.placeholder}>

						    <!-- input select box -->
						    {:else if input.type == "select_box"}
						    	<select class="form-control" bind:value={input.text}>
			                      <option selected disabled>-PILIH-</option>
			                      {#each input.option as option}
			                      <option>{option}</option>
			                      {/each}
			                    </select>
					        
					        <!-- input select box -->
						    {:else if input.type == "radio"}
							{#each input.option as option}
								<br/>
								<label>
									<input type="radio" value={option.value} bind:group={input.text}>
									{option.label}
								</label>
							{/each}
					        {/if}

                  			</div>

                  			{/each}

			                <div class="card-footer">
			                  <button type="submit" class="btn btn-primary">TAMBAHKAN LAYANAN</button>
			                </div>
              			
              			</form>
              		</div>
              	</div>
            </div>
        </div>
    </section>
            
 
</div>