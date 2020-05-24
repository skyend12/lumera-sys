<script>

	/*
	Transaction detail variable and element
	 */
	let transactionDetail = {
		id : ""
	}

	let topNav = [
		{
			nav_id    : "1",  
			nav_data  : "Produk Kecantikan",
			nav_class : "active"
		},
		{
			nav_id    : "2", 
			nav_data  : "Layanan Kecantikan",
			nav_class : ""
		}
	];

	function changeNav(nav){
		for(var i=0; i < topNav.length;i++){
			if(topNav[i].nav_id == nav){
				topNav[i].nav_class = "active";
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
		padding:0px 5px 18.5px 5px;
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

<div class="container mt-5">

	<span class="badge badge-pill badge-primary mb-2">ID TRANSAKSI #{transactionDetail.id}</span>
	<span class="badge badge-pill badge-success">TRANSAKSI BARU</span>

	<div class="row">
		
		<div class="col-lg-6">

			<div class="flex topnav">
				{#each topNav as nav}
					<p class:active="{nav.nav_class === 'active'}"
					   on:click="{() => changeNav(nav.nav_id)}">{nav.nav_data}</p>
				{/each}
			</div>

			<div>
				
			</div>

		</div>

	</div>

</div>