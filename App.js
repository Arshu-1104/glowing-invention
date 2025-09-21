import React, { useState } from "react";

const artisansData = [
  { id: 1, name: "Asha Patel", photo: "https://img.freepik.com/premium-photo/image-portrait-smiling-young-female-college-school-pretty-student-girl-solid-background_1021867-35983.jpg", bio: "Traditional block-print artisan from Rajasthan.", craft: "Handmade textile blocks and prints" },
  { id: 2, name: "Raju Singh", photo: "https://tse2.mm.bing.net/th/id/OIP.BaWwoS1-Q01Had91bbauWwHaFj?w=960&h=720&rs=1&pid=ImgDetMain&o=7&rm=3", bio: "Master woodcarver specializing in fine furniture.", craft: "Intricately carved wooden tables and chairs" },
  { id: 3, name: "Mina Devi", photo: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhpXfSnhf_YfKmNbNHubVsYnrvJbMSFg5E89hN0zCfE7EfRSsSgiMWNCaJz1Do_g4L3-Ap3nCtQy_sngHls3W3P1O9skoXWGDfXd7XnT3NIFVa3E1GRg3oODsXM5Aa-_7JXZkR9oIZumlK0xagYwr1sDDM6T4bAk2GCyHD6ajiI9cCFxYSGGp9xste5VzLs/s800/must-visit-shopping-destination-cebu.jpg", bio: "Jewelry artisan from South India with 15 years of experience.", craft: "Handcrafted silver and gemstone jewelry" }
];

const productsData = [
  { id: 1, name: "Block Printed Fabric", category: "textiles", price: 30, img: "https://i.pinimg.com/originals/5a/8b/c2/5a8bc2dd2110dcfaf84f3d3ef3e13a29.jpg" },
  { id: 2, name: "Carved Wooden Table", category: "woodwork", price: 150, img: "https://images.unsplash.com/photo-1505692977188-d7f99dc741b9?auto=format&fit=crop&w=800&q=60" },
  { id: 3, name: "Silver Gemstone Necklace", category: "jewelry", price: 80, img: "https://images.unsplash.com/photo-1556228727-9c29ff077af9?auto=format&fit=crop&w=800&q=60" },
  { id: 4, name: "Handwoven Textile Scarf", category: "textiles", price: 25, img: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=60" }
];

const backgroundStyle = {
  backgroundImage: 'url("https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1470&q=80")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  padding: '40px 20px',
  color: '#fff',
  minHeight: '100vh',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
};

const overlayStyle = {
  backgroundColor: 'rgba(85, 55, 0, 0.75)', // warm shadow overlay
  borderRadius: '10px',
  padding: '40px',
  maxWidth: '900px',
  margin: '0 auto',
  boxShadow: '0 0 30px rgba(43, 122, 11, 0.8)'
};

export default function ArtisanMarketplace() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(["textiles", "woodwork", "jewelry"]);
  const [lastClickedCategory, setLastClickedCategory] = useState(null);
  const [formData, setFormData] = useState({name:"", email:"", message:""});
  const [formErrors, setFormErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  const handleCategoryChange = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const filteredProducts = productsData.filter(
    p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) && selectedCategories.includes(p.category)
  );

  const recommendedProducts = lastClickedCategory
    ? productsData.filter(p => p.category === lastClickedCategory)
    : [];

  const handleInputChange = e => {
    setFormData({...formData, [e.target.name]: e.target.value});
    setFormErrors({...formErrors, [e.target.name]: ""});
    setSuccessMsg("");
  };

  const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = e => {
    e.preventDefault();
    let errors = {};
    if (!formData.name.trim()) errors.name = "Please enter your name.";
    if (!formData.email.trim()) errors.email = "Please enter your email.";
    else if (!validateEmail(formData.email)) errors.email = "Please enter a valid email.";
    if (!formData.message.trim()) errors.message = "Please enter a message.";

    if (Object.keys(errors).length) {
      setFormErrors(errors);
    } else {
      setFormErrors({});
      setSuccessMsg("Thank you! Your inquiry has been sent.");
      setFormData({name:"", email:"", message:""});
    }
  };

  return (
    <div style={backgroundStyle}>
      <div style={overlayStyle}>
        <h1 style={{textAlign:"center", marginBottom:"40px", fontWeight:"900", letterSpacing:"2px"}}>Meet Our Artisans</h1>
        <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap:"20px", marginBottom:"60px"}}>
          {artisansData.map(artisan => (
            <div key={artisan.id} style={{background:"#5a3e00", borderRadius:"10px", boxShadow:"0 0 20px rgba(0,0,0,0.5)", padding:"20px", transition:"transform 0.3s", cursor: "pointer"}}>
              <img src={artisan.photo} alt={artisan.name} style={{width:"100%", height:"200px", objectFit:"contain", borderRadius:"8px", marginBottom:"15px", filter:"brightness(0.85)"}} />
              <h3 style={{color:"#fff", marginBottom:"8px"}}>{artisan.name}</h3>
              <p style={{fontStyle:"italic", color:"#ddc87e", marginBottom:"5px"}}>{artisan.bio}</p>
              <p style={{color:"#e8d68a", fontWeight:"600"}}>{artisan.craft}</p>
            </div>
          ))}
        </div>

        <h1 style={{textAlign:"center", marginBottom:"30px", fontWeight:"900", letterSpacing:"2px"}}>Artisan Product Catalog</h1>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{width:"100%", padding:"12px", borderRadius:"8px", border:"none", marginBottom:"20px", fontSize:"1.1em", outline:"none"}}
        />
        <div style={{textAlign:"center", marginBottom:"30px", color:"#f9e79f"}}>
          {["textiles","woodwork","jewelry"].map(cat => (
            <label key={cat} style={{margin:"0 15px", cursor:"pointer", userSelect:"none"}}>
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => handleCategoryChange(cat)}
                style={{marginRight:"8px", cursor:"pointer"}}
              />
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </label>
          ))}
        </div>
        <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap:"20px", marginBottom:"60px"}}>
          {filteredProducts.length ? filteredProducts.map(product => (
            <div key={product.id} onClick={() => setLastClickedCategory(product.category)} style={{background:"#5a3e00", borderRadius:"10px", boxShadow:"0 0 20px rgba(0,0,0,0.5)", padding:"15px", textAlign:"center", cursor:"pointer", color:"#fff"}}>
              <img src={product.img} alt={product.name} style={{width:"100%", height:"180px", objectFit:"contain", borderRadius:"8px", marginBottom:"12px", filter:"brightness(0.85)"}} />
              <h3 style={{marginBottom:"8px"}}>{product.name}</h3>
              <p style={{color:"#f7dc6f", fontWeight:"bold"}}>${product.price}</p>
            </div>
          )) : <p style={{color:"#f5edd9", fontStyle:"italic"}}>No products found.</p>}
        </div>

        <h2 style={{textAlign:"center", marginBottom:"40px", color:"#f9e79f"}}>Recommended For You</h2>
        <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap:"20px", marginBottom:"40px"}}>
          {lastClickedCategory ? recommendedProducts.map(product => (
            <div key={product.id} style={{background:"#5a3e00", borderRadius:"10px", boxShadow:"0 0 20px rgba(0,0,0,0.5)", padding:"15px", textAlign:"center", color:"#fff"}}>
              <img src={product.img} alt={product.name} style={{width:"100%", height:"180px", objectFit:"contain", borderRadius:"8px", marginBottom:"12px", filter:"brightness(0.85)"}} />
              <h3 style={{marginBottom:"8px"}}>{product.name}</h3>
              <p style={{color:"#f7dc6f", fontWeight:"bold"}}>${product.price}</p>
            </div>
          )) : <p style={{textAlign:"center", color:"#f5edd9", fontStyle:"italic"}}>Click on a product to see recommendations.</p>}
        </div>

        <h1 style={{textAlign:"center", marginBottom:"30px", fontWeight:"900", letterSpacing:"2px", color:"#fff"}}>Contact Artisan</h1>
        <form onSubmit={handleSubmit} noValidate style={{maxWidth:"400px", margin:"0 auto 60px auto", background:"#5a3e00", padding:"20px", borderRadius:"10px", boxShadow:"0 0 30px rgba(0,0,0,0.7)"}}>
          <label htmlFor="name" style={{color:"#f9e79f"}}>Your Name</label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} style={{width:"100%", padding:"12px", marginBottom:"5px", borderRadius:"8px", border:"none", fontSize:"1em", outline:"none"}} />
          {formErrors.name && <div style={{color:"#ffb3b3", fontSize:"0.9em", marginBottom:"10px"}}>{formErrors.name}</div>}

          <label htmlFor="email" style={{color:"#f9e79f"}}>Your Email</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} style={{width:"100%", padding:"12px", marginBottom:"5px", borderRadius:"8px", border:"none", fontSize:"1em", outline:"none"}} />
          {formErrors.email && <div style={{color:"#ffb3b3", fontSize:"0.9em", marginBottom:"10px"}}>{formErrors.email}</div>}

          <label htmlFor="message" style={{color:"#f9e79f"}}>Message / Inquiry</label>
          <textarea id="message" name="message" rows="4" value={formData.message} onChange={handleInputChange} style={{width:"100%", padding:"12px", marginBottom:"5px", borderRadius:"8px", border:"none", fontSize:"1em", outline:"none"}} />
          {formErrors.message && <div style={{color:"#ffb3b3", fontSize:"0.9em", marginBottom:"10px"}}>{formErrors.message}</div>}

          <button type="submit" style={{width:"100%", padding:"15px", background:"#f7dc6f", color:"#5a3e00", fontWeight:"bold", border:"none", borderRadius:"10px", cursor:"pointer", fontSize:"1.1em"}}>
            Send Inquiry
          </button>
          {successMsg && <div style={{color:"#bfffbf", textAlign:"center", marginTop:"15px", fontWeight:"600"}}>{successMsg}</div>}
        </form>
      </div>
    </div>
  );
}
