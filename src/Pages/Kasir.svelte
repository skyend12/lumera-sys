<script>

	import {onMount} from 'svelte'
	import Modal from '../Component/Modal.svelte'
	import {formatRupiah} from '../Functions/CurrencyFormatting.svelte'
	import {HttpExecutor} from '../Functions/HttpModule.svelte'
	import {noScroll, enableScroll} from '../Functions/LayoutControl.svelte'
	import Cart from '../Component/Cart.svelte'

	let data_bind = [];
	let modal_state = false;

	/*
	Transaction detail variable and element
	 */
	let transactionDetail = {
		id : ""
	}

	let topNav = [
		{
			nav_id    : "1",  
			nav_data  : "Layanan Kecantikan",
			nav_class : "active"
		},
		{
			nav_id    : "2", 
			nav_data  : "Produk Kecantikan",
			nav_class : ""
		}
	];
	
	onMount(async() => {
		HttpExecutor("http://127.0.0.1/lumeraAPI/master_data/getAllSaloonServices.php", "GET")
			.then(data => {
				data_bind = data;
		  		console.log(data_bind);
			})
			.catch(err => {
				alert("Gagal mengambil data dari server");
			});

	});

	function openModal(data){
		modal_state = data;
	}

	function closeModal(event){
		modal_state = false;
	}

	function changeNav(nav){
		for(var i=0; i < topNav.length;i++){
			if(topNav[i].nav_id == nav){
				topNav[i].nav_class = "active";

				if(topNav[i].nav_id == "1"){
					HttpExecutor("http://127.0.0.1/lumeraAPI/master_data/getAllSaloonServices.php", "GET")
						.then(data => {
							data_bind = data;
					  		console.log(data_bind);
					    	console.log(data_bind[1][1].data);
						})
						.catch(err => {

						});
				}

				else if(topNav[i].nav_id == "2"){
					HttpExecutor("http://127.0.0.1/lumeraAPI/master_data/getAllSaloonServices.php", "GET")
						.then(data => {
							data_bind = data;
					  		console.log(data_bind);
					    	console.log(data_bind[1][1].data);
						})
						.catch(err => {

						});
				}

			}
			else{
				topNav[i].nav_class = "";	
			}
		}
	}

</script>

<style>

	.topnav{
		border-bottom:1px solid #dedede;
		margin-top:20px;
	}
	
	.topnav p{
		font-weight: bold;
		font-family:'Lato';
		font-size:12.5px;
		cursor: pointer;
		position:relative;
		margin: 0px 20px 0px 0;
		padding:0px 5px 15px 5px;
		transition: all 0.2s ease;
	}

	.topnav p:hover{
		color:#5e72e4;
		opacity:0.5;
	}

	.active{
		position:relative;
		color:#5e72e4;
	}

	.active::after{
		content:"*";
		height: 3px;
		position:absolute;
		left:0;
		bottom:0;
		width:100%;
		color:transparent;
		border-radius: 3px 3px 0 0;
		background: #5e72e4;
	}

</style>

<Modal modal_state={modal_state} on:modal_control={closeModal}/>

<div class="container mt-5">
	
	<span class="badge badge-pill badge-primary mb-2">ID TRANSAKSI #{transactionDetail.id}</span>
	<span class="badge badge-pill badge-success">TRANSAKSI BARU</span>

	<div class="row">
		
		<div class="col-lg-8">

			<div class="flex topnav">
				
				{#each topNav as nav}
					<p class:active="{nav.nav_class === 'active'}"
					   on:click="{() => changeNav(nav.nav_id)}">{nav.nav_data}</p>
				{/each}

				<div class="input-group" style="width:200px;position:absolute;right:0;top:0">
			       	<input style="background:none;border:none;border-bottom:1px solid black;border-radius:0px;" class="form-control" placeholder="Cari disini.." type="text">
			        <div class="input-group-append" style="border:none;background:none">
			         	<span class="input-group-text"><i style="cursor: pointer;border:none;background:none" class="fa fa-search"></i></span>
			        </div>
			    </div>

			</div>

			<div class="row mt-4">
				{#each data_bind as product, i}
					{#if product[2].data != "Klinik"}
						<div class="col-lg-4"> 
							<div class="card p-3">
								<p class="mb-1" style="font-size:1.0rem">{product[1].data}</p>
								<p class="mb-2" style="font-weight: bold;font-size:0.8rem">{formatRupiah(product[2].data, "Rp. ")}/pcs</p>
								<button class="btn btn-success btn-sm" on:click={()=>openModal(product[0].data)}><i class="fa fa-plus p-2 bg-success "></i>TAMBAHKAN</button>
							</div>
						</div>
					{/if}
				{/each}
			</div>

		</div>

		<div class="col-lg-4">
			<Cart/>
		</div>

	</div>

</div>