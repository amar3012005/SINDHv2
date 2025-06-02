import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, AlertCircle } from 'lucide-react';

const ProductPage = () => {
  const [selectedSerial, setSelectedSerial] = useState('');
  const [activeSection, setActiveSection] = useState('description');
  const [isNotifying, setIsNotifying] = useState(false);
  const navigate = useNavigate();

  // Simulate available serial numbers
  const availableSerials = ['001', '002', '003', '025', '042', '069', '100'];

  const handleSerialSelect = (serial) => {
    setSelectedSerial(serial);
  };

  const handleNotifyClick = () => {
    setIsNotifying(true);
    
    // Reset after 2 seconds
    setTimeout(() => {
      setIsNotifying(false);
    }, 2000);
  };

  const toggleSection = (section) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation breadcrumbs */}
      <div className="flex items-center space-x-2 px-4 py-3 text-xs font-mono text-white/60">
        <div className="cursor-pointer hover:text-white" onClick={() => navigate('/')}>HOME</div>
        <div className="text-white/40">/</div>
        <div className="cursor-pointer hover:text-white" onClick={() => navigate('/products')}>COLLECTIBLE</div>
        <div className="text-white/40">/</div>
        <div className="cursor-pointer hover:text-white" onClick={() => navigate('/products')}>LOOP STEEL WATCH</div>
        <div className="text-white/40">/</div>
        <div className="text-white">INSTWN // BLACK</div>
      </div>
      
      {/* Product page container */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column: Product Images */}
          <div className="space-y-4">
            {/* Main product image */}
            <div className="bg-zinc-900 border border-zinc-800 flex items-center justify-center p-4 relative">
              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm p-1 rounded-full">
                <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8"></path>
                    <path d="M3 16.2V21m0-4.8H7.8"></path>
                    <path d="M21 7.8V3m0 4.8h-4.8"></path>
                    <path d="M7.8 3H3v4.8"></path>
                  </svg>
                </button>
              </div>
              <img 
                src="/images/black_diodev1.png" 
                alt="INSTWN // BLACK Digital Watch" 
                className="w-full h-auto max-w-md"
              />
            </div>
            
            {/* Thumbnail gallery */}
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className={`aspect-square bg-zinc-900 border ${idx === 1 ? 'border-white' : 'border-zinc-800'} overflow-hidden cursor-pointer hover:border-white/70 transition`}>
                  <img 
                    src="/images/black_diodev1.png" 
                    alt={`Product thumbnail ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            
            {/* Light/Dark mode toggle */}
            <div className="flex items-center justify-center space-x-4 pt-4 border-t border-zinc-800">
              <button className="w-10 h-10 flex items-center justify-center rounded-full overflow-hidden bg-gray-700">
                <span className="w-5 h-5 rounded-full bg-white"></span>
              </button>
              <div className="border-t border-zinc-700 w-8"></div>
              <button className="w-10 h-10 flex items-center justify-center rounded-full overflow-hidden bg-zinc-900 border-2 border-white">
                <span className="w-5 h-5 rounded-full bg-black"></span>
              </button>
            </div>
          </div>
          
          {/* Right column: Product Details and Actions */}
          <div>
            <h1 className="text-3xl font-bold mb-2">INSTWN // BLACK</h1>
            <div className="flex items-center space-x-2">
              <div className="text-white/80 text-2xl font-mono">RS.7999</div>
            </div>
            
            {/* Serial number selection */}
            <div className="mt-8 space-y-4">
              <h2 className="text-sm font-mono text-white/80">CHOOSE SERIAL NO.</h2>
              <div className="grid grid-cols-4 gap-2">
                {availableSerials.map((serial) => (
                  <button
                    key={serial}
                    className={`py-2 border ${
                      selectedSerial === serial 
                        ? 'border-white bg-white/10' 
                        : 'border-zinc-700 hover:border-white/60'
                    } font-mono text-sm transition-colors`}
                    onClick={() => handleSerialSelect(serial)}
                  >
                    {serial}
                  </button>
                ))}
              </div>
              
              <div className="mt-6">
                <button 
                  className={`w-full py-3 font-mono text-center transition-colors ${
                    selectedSerial 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-zinc-800 cursor-not-allowed'
                  }`}
                  disabled={!selectedSerial}
                  onClick={selectedSerial ? handleNotifyClick : undefined}
                >
                  {isNotifying ? "EMAIL SENT ✓" : "NOTIFY ME"}
                </button>
              </div>
            </div>
            
            {/* Important order disclaimer */}
            <div className="mt-8 border border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors" 
                onClick={() => toggleSection('disclaimer')}>
                <div className="flex items-center space-x-2">
                  <AlertCircle size={16} className="text-white/70" />
                  <h3 className="font-mono text-sm">IMPORTANT ORDER DISCLAIMER - UNIQUE SERIAL NUMBERS</h3>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`transition-transform duration-300 ${activeSection === 'disclaimer' ? 'rotate-180' : ''}`} 
                />
              </div>
              
              {activeSection === 'disclaimer' && (
                <div className="p-4 border-t border-zinc-800 text-sm text-white/80 font-sans leading-relaxed">
                  <p className="mb-4">Each loop is a one-of-a-kind piece with a unique serial number—no two are the same. In cases of double orders for the same serial number, priority will go to the first confirmed purchase. If your order is affected:</p>
                  <p className="mb-4">Our team will contact you via call, email, or WhatsApp to offer an alternative available serial number or variant (if stock allows).</p>
                  <p className="mb-4">If we cannot reach you after multiple attempts, we will assign a number of our choice to keep your order moving.</p>
                  <p>If no replacement is available, a full refund will be issued; please stay available after placing your order to avoid delays.</p>
                </div>
              )}
            </div>
            
            {/* Product details accordions */}
            <div className="mt-4">
              <div className="border border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors" 
                  onClick={() => toggleSection('description')}>
                  <h3 className="font-mono text-sm">DESCRIPTION</h3>
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform duration-300 ${activeSection === 'description' ? 'rotate-180' : ''}`} 
                  />
                </div>
                
                {activeSection === 'description' && (
                  <div className="p-4 border-t border-zinc-800 text-sm text-white/80 font-sans leading-relaxed">
                    <p>The BLACK_DIODE is our flagship digital timepiece, featuring a sleek black steel construction with premium etched details. The bright LED display provides exceptional visibility in all lighting conditions, while the durable steel construction ensures longevity.</p>
                    <p className="mt-2">Each piece is individually numbered and features a unique serial identifier, making it a true collector's item. The watch includes our signature loop steel band that's both comfortable for daily wear and stylish for any occasion.</p>
                    <p className="mt-2">Water-resistant up to 50 meters and featuring a long-lasting battery, the BLACK_DIODE is designed for the modern enthusiast who values both form and function.</p>
                  </div>
                )}
              </div>
              
              <div className="border border-zinc-800 bg-zinc-900/50 mt-2">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors" 
                  onClick={() => toggleSection('details')}>
                  <h3 className="font-mono text-sm">PRODUCT DETAILS</h3>
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform duration-300 ${activeSection === 'details' ? 'rotate-180' : ''}`} 
                  />
                </div>
                
                {activeSection === 'details' && (
                  <div className="p-4 border-t border-zinc-800 text-sm text-white/80 font-sans leading-relaxed">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Steel case and band construction</li>
                      <li>Digital LED display with high brightness</li>
                      <li>Custom-etched back plate with serial number</li>
                      <li>Water-resistant up to 50 meters</li>
                      <li>Battery life: Approximately 2 years</li>
                      <li>Dimensions: 42mm x 36mm x 12mm</li>
                      <li>Weight: 145g</li>
                      <li>Adjustable band fits wrists 6.5" to 8.5"</li>
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="border border-zinc-800 bg-zinc-900/50 mt-2">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors" 
                  onClick={() => toggleSection('box')}>
                  <h3 className="font-mono text-sm">WHAT'S IN THE BOX</h3>
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform duration-300 ${activeSection === 'box' ? 'rotate-180' : ''}`} 
                  />
                </div>
                
                {activeSection === 'box' && (
                  <div className="p-4 border-t border-zinc-800 text-sm text-white/80 font-sans leading-relaxed">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>BLACK_DIODE Watch</li>
                      <li>Premium matte black metal case</li>
                      <li>Authentication certificate with matching serial number</li>
                      <li>Manual and warranty information</li>
                      <li>Microfiber cleaning cloth</li>
                      <li>Link removal tool</li>
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="border border-zinc-800 bg-zinc-900/50 mt-2">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors" 
                  onClick={() => toggleSection('strap')}>
                  <h3 className="font-mono text-sm">ATTACHMENTS OF STRAP</h3>
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform duration-300 ${activeSection === 'strap' ? 'rotate-180' : ''}`} 
                  />
                </div>
                
                {activeSection === 'strap' && (
                  <div className="p-4 border-t border-zinc-800 text-sm text-white/80 font-sans leading-relaxed">
                    <p>The BLACK_DIODE comes with our premium steel loop band, engineered for both comfort and durability. The band features:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li>Matte black steel links</li>
                      <li>Hidden clasp mechanism</li>
                      <li>Adjustable sizing with included link removal tool</li>
                      <li>Ergonomic design for all-day comfort</li>
                      <li>Scratch-resistant coating</li>
                    </ul>
                    <p className="mt-2">Additional compatible bands are available for separate purchase.</p>
                  </div>
                )}
              </div>
              
              <div className="border border-zinc-800 bg-zinc-900/50 mt-2">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors" 
                  onClick={() => toggleSection('faqs')}>
                  <h3 className="font-mono text-sm">FAQS</h3>
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform duration-300 ${activeSection === 'faqs' ? 'rotate-180' : ''}`} 
                  />
                </div>
                
                {activeSection === 'faqs' && (
                  <div className="p-4 border-t border-zinc-800 text-sm text-white/80 font-sans leading-relaxed">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-1">How do I adjust the band size?</h4>
                        <p>Use the included link removal tool to adjust the band to your desired size. Instructions are included in the manual.</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Is this watch water-resistant?</h4>
                        <p>Yes, the BLACK_DIODE is water-resistant up to 50 meters. It's suitable for swimming and showering, but not for diving.</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">How do I change the battery?</h4>
                        <p>We recommend having the battery replaced by a professional jeweler or watchmaker to maintain the water-resistant seal.</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">What is the warranty period?</h4>
                        <p>The BLACK_DIODE comes with a 2-year limited warranty covering manufacturing defects.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="border border-zinc-800 bg-zinc-900/50 mt-2">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors" 
                  onClick={() => toggleSection('shipping')}>
                  <h3 className="font-mono text-sm">SHIPPING</h3>
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform duration-300 ${activeSection === 'shipping' ? 'rotate-180' : ''}`} 
                  />
                </div>
                
                {activeSection === 'shipping' && (
                  <div className="p-4 border-t border-zinc-800 text-sm text-white/80 font-sans leading-relaxed">
                    <p>We ship worldwide with the following options:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li>Standard shipping (7-10 business days): Free</li>
                      <li>Express shipping (3-5 business days): ₹599</li>
                      <li>Priority shipping (1-2 business days): ₹999</li>
                    </ul>
                    <p className="mt-2">All orders are processed within 24 hours and include tracking information. International orders may be subject to customs duties and taxes.</p>
                  </div>
                )}
              </div>
              
              <div className="border border-zinc-800 bg-zinc-900/50 mt-2">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors" 
                  onClick={() => toggleSection('returns')}>
                  <h3 className="font-mono text-sm">RETURNS</h3>
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform duration-300 ${activeSection === 'returns' ? 'rotate-180' : ''}`} 
                  />
                </div>
                
                {activeSection === 'returns' && (
                  <div className="p-4 border-t border-zinc-800 text-sm text-white/80 font-sans leading-relaxed">
                    <p>We offer a 30-day return policy for unworn items in original condition:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li>Items must be unworn and in original condition with all tags attached</li>
                      <li>Original packaging must be intact and included</li>
                      <li>Return shipping costs are the responsibility of the customer</li>
                      <li>Exchanges are available for different serial numbers subject to availability</li>
                    </ul>
                    <p className="mt-2">To initiate a return, please contact our customer service team with your order number.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;