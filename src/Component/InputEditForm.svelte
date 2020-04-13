<script type="text/javascript">

	import {onMount} from 'svelte'
	import {Link} from 'svelte-routing'
	export let formController;
	let data_id = null;

 	$:formController;

	// loading screen
	let spinner = false;

	onMount(async => {

		if(formController.mode == "edit"){
			fetch(formController.api.apiRawData, {
	        	method : 'GET'
	    	}).then(res => res.json())
	    	.then(data => {
	    		let i = 0;
	    		console.log(data);
	    		if(data.length > 0){
		    		data_id = data[0][0].data;
		    		for(i; i < formController.forms.length; i++){
		    			formController.forms[i].text = data[0][i + 1].data;
		    		}
		    	}
	    		console.log(data);
	    	})
		}
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
				temporary_get_gate = temporary_get_gate + "data_" + i + "=" + formController.forms[i].text + "&";
			}

		}

		if(validation == 1){

			let confirm_changes = confirm("Anda yakin akan menyimpan perubahan ini?");
			if (confirm_changes == true) {
				let api_url = formController.api.apiUrl + temporary_get_gate + "data_id=" + data_id;
			    httpRequest(api_url);
			}
		}
	}

	function formatRupiah(angka, prefix){

		if(angka != undefined){
			angka = angka.toString();
		    var number_string = angka.replace(/[^,\d]/g, '').toString();
		    var split         = number_string.split(',');
		    var sisa          = split[0].length % 3;
		    var rupiah        = split[0].substr(0, sisa);
		    var ribuan        = split[0].substr(sisa).match(/\d{3}/gi);

		    var separator;
		    // tambahkan titik jika yang di input sudah menjadi angka ribuan
		    if(ribuan){
		      separator = sisa ? '.' : '';
		      rupiah += separator + ribuan.join('.');
		     }
		 
		    rupiah = split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
		    return prefix == undefined ? rupiah : (rupiah ? 'Rp. ' + rupiah : '');
		}
		return "Rp. 0"
    }

	function httpRequest(api){
		
		spinner = true;

		fetch(api, {
	        method : 'GET'
	    }).then(res => res.json())
	    .then(data => { 
	      let data_raw = data;
	      console.log(data_raw);
	      alert("Perubahan data berhasil disimpan");
	      spinner = false;
	      window.history.back();
	    })
	    .catch(err => {
	      console.log(err);
	      alert("Gagal menyimpan data ke basis data\n- Cek koneksi internet anda\n- Coba dalam beberapa saat lagi");
	      spinner = false;
	    })
	}

	let formattedSelected;
	let dateChosen;

</script>

<style type="scss">
	
</style>

<div class="container">

	<div class='button-container'>
		<button id='test'>My Custom Button</button>
	</div>

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
						        <input type="text" required="{input.required}" bind:value={input.text} disabled="{input.disabled}" class="form-control" id="service" placeholder={input.placeholder}>

						    <!-- input textarea -->
                			{:else if input.type == "textarea"}   
						        <textarea required="{input.required}" bind:value={input.text} disabled="{input.disabled}" class="form-control" id="service" placeholder={input.placeholder}></textarea>

						    <!-- input number -->
						    {:else if input.type == "number"}
						    	<input type="number" required="{input.required}" bind:value={input.text} class="form-control" id="service" placeholder={input.placeholder}>	

						    {:else if input.type == "date"}
						    	<input type="date" required="{input.required}" bind:value={input.text} class="form-control" id="service">
						    	<input type="text" name="foo"/>
						    <!-- input currency -->
						    {:else if input.type == "currency"}
						    	<input type="number" required="{input.required}" bind:value={input.text} class="form-control" id="service" placeholder={input.placeholder}>
						    	<input type="text" style="margin-top: 10px;" disabled="true" value={formatRupiah((input.text),"Rp")} class="form-control" id="service" placeholder="Rp. 0">

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
			                  <button type="submit" class="btn btn-primary">
			                  	{#if spinner == true}
			                  		Loading..
			                  	{:else if spinner == false}
			                  		SIMPAN
			                  	{/if}
			              	  </button>
			                </div>
              			
              			</form>
              		</div>
              	</div>
            </div>
        </div>
    </section>
            
 
</div>