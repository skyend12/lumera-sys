<script>

	import { createEventDispatcher } from 'svelte';
	import {HttpExecutor} from '../Functions/HttpModule.svelte'
	export let modal_state;
	let data_bind = [];
	let data_passed = false;

	const dispatch = createEventDispatcher();

	$: if(data_passed == false && modal_state != false){
		HttpExecutor("http://127.0.0.1/lumeraAPI/cashier/getSalonModalData.php?id=" + modal_state, "GET")
			.then(data => {
				data_bind = data;
				data_passed = true;
		  		console.log(data_bind);
		    })
			.catch(err => {
				alert("Gagal mengambil data dari server");
			});
	}


	function modalControl(){
		dispatch('modal_control');
		data_passed = false;
		console.log("out of modal");
	}

	

</script>

<style>

	#modal-bg{
		background-color: #000;
		top: 0;
		position: fixed;
		z-index: 9999;
		width: 100%;
		height: 100%;
		opacity:0.6;
		left:0;
	}

	#modal-container{
		position:fixed;
		top:50%;
		left:50%;
		transform:translate(-50%, -50%);
		width:300px;
		height:300px;
		border-radius:5px;
		color:#0d0d0d;
		background:#fff;
		z-index: 10000;
	}

	#modal-container div{
		margin-left:15px;
		margin-right:15px;
	}

</style>
<p id="data">{modal_state}</p>
{#if data_passed}
	<div on:click={()=>modalControl()} id="modal-bg"></div>
	<div id="modal-container">
		<div>
			<h3>
			  <small class="text-muted">With faded secondary text</small>
			</h3>
			<p>Piih Stylish</p>
			<select class="form-control">
				<option disabled=true selected>Pilih Stylish</option>
				{#each data_bind[1] as staf}
					<option>{staf.staff_name}</option>
				{/each}
			</select>
			<button type="button" class="btn btn-primary w-100 mt-3" on:click={()=>modalControl()}>Tambahkan</button>
		</div>
	</div>
{/if}