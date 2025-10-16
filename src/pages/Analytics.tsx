import React from 'react'
import { Card } from '../components/ui/Card'

export const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h4 text-text-primary">Analytics</h1>
        <p className="text-body2 text-text-secondary mt-1">
          Detailed analytics and insights for your business.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-h6 text-text-primary mb-4">Traffic Overview</h3>
          <div className="h-64 bg-background-hover rounded-lg flex items-center justify-center">
            <p className="text-text-tertiary">Analytics chart placeholder</p>
          </div>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-h6 text-text-primary mb-4">Conversion Funnel</h3>
          <div className="h-64 bg-background-hover rounded-lg flex items-center justify-center">
            <p className="text-text-tertiary">Funnel chart placeholder</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

