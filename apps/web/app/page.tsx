'use client'

import { useState, useEffect } from 'react'
import { CirclesLogo } from '@/components/CirclesLogo'
import LinkedInEnrichButton from '@/components/LinkedInEnrichButton'
import { 
  Download, 
  Smartphone, 
  Users, 
  Zap, 
  Star, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight,
  CheckCircle,
  Globe,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react'

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false)
  const [demoEmail, setDemoEmail] = useState('')

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-20 pb-32">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Navigation */}
          <nav className={`flex items-center justify-between mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <div className="flex items-center gap-3">
              <CirclesLogo size={48} className="circle-glow" />
              <span className="text-2xl font-bold">All My Circles</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <a href="http://localhost:8081" className="text-blue-400 hover:text-blue-300 transition-colors">Try Web App</a>
              <button className="glass glass-hover px-6 py-2 rounded-full font-medium">
                Get Started
              </button>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
                Professional Networking
                <br />
                <span className="gradient-text">& B2B Sales</span>
              </h1>
              <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                Connect. Network. Convert. Transform how you manage your professional relationships with CRM integration and smart networking insights.
              </p>
            </div>

            <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-semibold flex items-center gap-3 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25">
                  <Download size={20} />
                  Download for iOS
                </button>
                <button className="glass glass-hover px-8 py-4 rounded-2xl font-semibold flex items-center gap-3 transition-all duration-300">
                  <Smartphone size={20} />
                  Download for Android
                </button>
              </div>

              <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>CRM integration</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image/Demo */}
          <div className={`mt-20 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="relative max-w-2xl mx-auto">
              <div className="glass rounded-3xl p-8 animate-float">
                <div className="bg-slate-900 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Users size={20} className="text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">Sarah Chen</div>
                      <div className="text-sm text-gray-400">sarah@techstartup.com</div>
                    </div>
                    <Star size={16} className="text-yellow-400 fill-current" />
                  </div>
                  <div className="flex gap-2">
                    <span className="glass px-3 py-1 text-xs rounded-full">Client</span>
                    <span className="glass px-3 py-1 text-xs rounded-full">B2B Sales</span>
                    <span className="glass px-3 py-1 text-xs rounded-full">SF</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything you need</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Powerful features designed to make professional networking and B2B sales effortless and intelligent.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="text-blue-400" size={24} />,
                title: "CRM Integration",
                description: "Seamlessly sync with HubSpot, Salesforce, and Pipedrive. Push contacts directly to your sales pipeline."
              },
              {
                icon: <Sparkles className="text-purple-400" size={24} />,
                title: "Smart Networking",
                description: "Track relationship strength, follow-up reminders, and networking ROI. Never miss an opportunity."
              },
              {
                icon: <Clock className="text-green-400" size={24} />,
                title: "Conference Ready",
                description: "Perfect for conferences and events. Organize contacts by meetings, prospects, and clients."
              },
              {
                icon: <Users className="text-orange-400" size={24} />,
                title: "Professional Groups",
                description: "Organize by conferences, clients, prospects, and teams. Built for B2B professionals."
              },
              {
                icon: <Shield className="text-red-400" size={24} />,
                title: "Lead Scoring",
                description: "Score contacts based on interaction patterns and convert networking into sales opportunities."
              },
              {
                icon: <Globe className="text-cyan-400" size={24} />,
                title: "Cross-Platform",
                description: "Native iOS and Android apps with web sync. Access your professional network anywhere."
              }
            ].map((feature, index) => (
              <div key={index} className="glass glass-hover rounded-2xl p-6 transition-all duration-300 hover:scale-105">
                <div className="mb-4 p-3 rounded-xl bg-slate-800/50 w-fit">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-3">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How it works</h2>
            <p className="text-xl text-gray-300">
              Three simple steps to transform your professional networking
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: <Users size={32} className="text-blue-400" />,
                title: "Connect",
                description: "Capture professional contacts at conferences, meetings, and networking events. Build your circle."
              },
              {
                step: "02", 
                icon: <Sparkles size={32} className="text-purple-400" />,
                title: "Network",
                description: "Track relationship strength, set follow-up reminders, and organize by clients, prospects, and teams."
              },
              {
                step: "03",
                icon: <Clock size={32} className="text-green-400" />,
                title: "Convert",
                description: "Push qualified contacts to your CRM and convert networking activities into sales opportunities."
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="glass rounded-3xl p-8 mb-6 hover:scale-105 transition-transform duration-300">
                  <div className="text-6xl font-bold text-blue-500/20 mb-4">{step.step}</div>
                  <div className="mb-4">{step.icon}</div>
                  <h3 className="font-bold text-xl mb-3">{step.title}</h3>
                  <p className="text-gray-300">{step.description}</p>
                </div>
                {index < 2 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 transform -translate-y-1/2 text-gray-600" size={24} style={{ left: '85%' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LinkedIn Enrichment Demo */}
      <section className="py-24 px-6 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">LinkedIn Enrichment Demo</h2>
            <p className="text-xl text-gray-300">
              Try our contact enrichment feature - enter an email to get LinkedIn profile data
            </p>
          </div>

          <div className="glass rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="space-y-6">
              <div>
                <label htmlFor="demo-email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="demo-email"
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                  placeholder="example@company.com"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
              
              <LinkedInEnrichButton 
                email={demoEmail}
                onEnrichmentComplete={(result) => {
                  console.log('Enrichment result:', result);
                  if (result.success && result.data) {
                    alert(`Found LinkedIn data for ${result.data.name || 'contact'}!`);
                  }
                }}
                className="w-full"
              />
              
              <div className="text-xs text-gray-400 text-center">
                * This is a demo using real LinkedIn data enrichment
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple pricing</h2>
            <p className="text-xl text-gray-300">
              Start free, upgrade when you need more power
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-4">Free</h3>
              <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-gray-400 font-normal">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>Up to 100 contacts</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>Basic networking</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>Smart search & groups</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>Cross-platform sync</span>
                </li>
              </ul>
              <button className="w-full glass glass-hover py-3 rounded-xl font-semibold">
                Get Started Free
              </button>
            </div>

            <div className="glass rounded-2xl p-8 border-blue-500/50 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">Popular</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Pro</h3>
              <div className="text-4xl font-bold mb-6">$29<span className="text-lg text-gray-400 font-normal">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>Unlimited contacts</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>CRM sync</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>Advanced features</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>Follow-up reminders</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400" />
                  <span>Priority support</span>
                </li>
              </ul>
              <button className="w-full bg-blue-500 hover:bg-blue-600 py-3 rounded-xl font-semibold transition-colors">
                Start Pro Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">Ready to transform your networking?</h2>
          <p className="text-xl text-gray-300 mb-12">
            Join thousands of professionals who never lose touch with their network.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-12 py-4 rounded-2xl font-semibold flex items-center gap-3 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25">
              <Download size={20} />
              Get Started Now
            </button>
            <button className="glass glass-hover px-12 py-4 rounded-2xl font-semibold transition-all duration-300">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              <CirclesLogo size={32} />
              <span className="text-lg font-semibold">All My Circles</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
              <a href="#" className="hover:text-white transition-colors">Blog</a>
            </div>
          </div>
          <div className="text-center text-gray-500 text-sm mt-8">
            © 2024 All My Circles. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}