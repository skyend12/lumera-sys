<script>

</script>

<style>

	#modal-bg{
		background-color: #000;
		top: 0;
		position: absolute;
		z-index: 9999;
		width: 100%;
		height: 100%;
		opacity:0.6;
		left:0;
	}

	#modal-container{
		position:absolute;
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

<div id="modal-bg"></div>
<div id="modal-container">
	<div>
		<h3>
		  Cat Rambut
		  <small class="text-muted">With faded secondary text</small>
		</h3>
		<p>Piih Stylish</p>
		<select class="form-control">
			<option disabled=true selected>Pilih Stylish</option>
			<option>Ma Dong Chan</option>
		</select>
		<button type="button" class="btn btn-primary w-100 mt-3">Tambahkan</button>
	</div>
</div>