import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        // Get distinct categories from published courses with course counts
        const categoryGroups = await prisma.course.groupBy({
            by: ['category', 'categoryAr'],
            where: {
                status: 'PUBLISHED'
            },
            _count: {
                id: true
            }
        })

        // Get search params to determine language
        const { searchParams } = new URL(req.url)
        const locale = searchParams.get('locale') || 'en'
        
        // Create comprehensive category objects
        const categoriesWithCounts = categoryGroups
            .filter((group): group is typeof group & { category: string; categoryAr: string } => 
                Boolean(group.category && group.categoryAr)
            ) // Only include complete categories with type assertion
            .map(group => ({
                id: group.category.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                name: locale === 'ar' ? group.categoryAr : group.category,
                nameEn: group.category,
                nameAr: group.categoryAr,
                courseCount: group._count.id
            }))
            .sort((a, b) => {
                // Sort by course count (descending) then by name
                if (b.courseCount !== a.courseCount) {
                    return b.courseCount - a.courseCount
                }
                return a.name.localeCompare(b.name, locale === 'ar' ? 'ar' : 'en')
            })
        
        // Also provide simple array for backward compatibility
        const categoriesArray = categoriesWithCounts.map(cat => cat.name)
        
        return NextResponse.json({
            categories: categoriesArray,
            categoriesWithCounts,
            totalCategories: categoriesWithCounts.length,
            totalCourses: categoriesWithCounts.reduce((sum, cat) => sum + cat.courseCount, 0),
            locale
        })

    } catch (error) {
        console.error('Categories fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        )
    }
}
