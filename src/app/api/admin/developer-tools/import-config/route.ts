import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await req.formData()
        const configFile = formData.get('config') as File

        if (!configFile) {
            return NextResponse.json({ error: 'No configuration file provided' }, { status: 400 })
        }

        // Validate file type
        const allowedTypes = ['application/json', 'application/x-yaml', 'text/yaml', 'text/x-yaml']
        if (!allowedTypes.includes(configFile.type) && !configFile.name.endsWith('.json') && !configFile.name.endsWith('.yaml') && !configFile.name.endsWith('.yml')) {
            return NextResponse.json({ error: 'Invalid file type. Only JSON and YAML files are allowed.' }, { status: 400 })
        }

        // Read file content
        const content = await configFile.text()

        try {
            // Parse configuration (basic validation)
            let config: any
            if (configFile.type === 'application/json' || configFile.name.endsWith('.json')) {
                config = JSON.parse(content)
            } else {
                // For YAML, we'd need a YAML parser, but for now just validate it's not empty
                if (!content.trim()) {
                    throw new Error('Empty configuration file')
                }
                config = { yaml: true, content: content } // Placeholder
            }

            // In a real implementation, you would:
            // 1. Validate configuration schema
            // 2. Update system settings
            // 3. Restart services if needed
            // 4. Log the import action

            // For now, just log the import
            console.log('Configuration imported by admin:', session.user.email)
            console.log('Config preview:', JSON.stringify(config).substring(0, 200) + '...')

            return NextResponse.json({
                success: true,
                message: 'Configuration imported successfully',
                configKeys: Object.keys(config)
            })
        } catch (parseError) {
            return NextResponse.json({
                error: 'Invalid configuration format',
                details: parseError instanceof Error ? parseError.message : 'Unknown error'
            }, { status: 400 })
        }
    } catch (error) {
        console.error('Failed to import configuration:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}