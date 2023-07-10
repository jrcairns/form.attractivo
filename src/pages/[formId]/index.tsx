import { useMutation, useQuery } from "@tanstack/react-query"
import { useRouter } from "next/router"

import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { InfoCircledIcon } from "@radix-ui/react-icons"
import { CheckCircle, Loader2 } from "lucide-react"
import { useState } from "react"

const getFormSchema = z.object({
    name: z.string(),
    fields: z.array(z.object({ value: z.string() })),
    companyName: z.string(),
    description: z.string()
})

const baseApiUrl = process.env.VERCEL_ENV === "development" ? "http://localhost:3000" : "https://app.attractivo.ca";

export default function SubmitLead() {
    const router = useRouter()

    const { data, isLoading } = useQuery({
        queryKey: ["form", router.query.formId],
        queryFn: async () => {
            const response = await fetch(`${baseApiUrl}/api/form/${router.query.formId}`)

            const formData = await response.json()

            return getFormSchema.parse(formData)
        },
        enabled: !!router?.query?.formId
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        )
    }

    return (
        <div className="md:h-screen md:overflow-hidden md:flex">
            <div className="flex flex-col p-8 md:p-12 md:w-2/5 md:max-w-xl bg-neutral-100">
                <h1 className="text-2xl leading-tight"><span className="underline">{data?.companyName}</span> partners with Attractivo for customer management.</h1>
                <p className="mt-2 leading-snug text-neutral-600">{data?.description}</p>

                <div className="hidden mt-auto space-y-2 text-sm md:block text-neutral-600">
                    <div className="flex items-center space-x-1.5">
                        <span>Powered by <a href="https://attractivo.ca" target="__blank" className="font-bold">Attractivo.ca</a></span>
                        <AttractivoTooltip />
                    </div>
                    <p>Terms</p>
                    <p>Privacy</p>
                </div>
            </div>
            <div className="flex-1 p-8 overflow-auto md:p-12">
                {!!data && <SubmitForm data={data} />}
            </div>
            <div className="p-8 mt-auto space-y-2 text-sm md:hidden text-neutral-600 bg-neutral-100">
                <div className="flex items-center space-x-1.5">
                    <span>Powered by <a href="https://attractivo.ca" target="__blank" className="font-bold">Attractivo.ca</a></span>
                    <AttractivoTooltip />
                </div>
                <p>Terms</p>
                <p>Privacy</p>
            </div>
        </div>
    )
}

const formSchema = z.object({
    name: z.string().min(3),
    phoneNumber: z.string().refine(value => /^\+?[1-9]\d{1,14}$/.test(value), {
        message: 'Invalid phone number',
    }),
    emailAddress: z.string().email(),
}).passthrough()

type FormValues = z.infer<typeof formSchema> & { [K: string]: string };

function SubmitForm({ data }: { data: z.infer<typeof getFormSchema> }) {
    const [submitted, setSubmitted] = useState(false)
    const router = useRouter()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            phoneNumber: "",
            emailAddress: "",
            ...data.fields.reduce((values, field) => {
                values[field.value] = "";
                return values;
            }, {} as { [key: string]: string })
        },
    });

    const { mutate, isLoading } = useMutation<void, unknown, FormValues>({
        mutationFn: async (data) => {
            try {
                await fetch(`http://localhost:3000/api/form/${router.query.formId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data)
                })

                return;
            } catch (error) {
                console.log(error)
            }
        },
        onSuccess: () => {
            setSubmitted(true)
            form.reset()
        }
    })

    function onSubmit(values: FormValues) {
        mutate(values)
    }

    if (submitted) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl leading-tight">You&apos;re all set!</p>
                    <p className="mt-2 text-sm text-neutral-500">{data.companyName} will be in contact with you at their earliest availability.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-sm">
            <h2 className="text-2xl leading-tight">Let&apos;s get started!</h2>
            <p className="mt-2 mb-8 text-sm text-neutral-500">This information will be used when scheduling you in.</p>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel>Your Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your Name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="Phone Number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="emailAddress"
                        render={({ field }) => (
                            <FormItem className="space-y-1.5">
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                    <Input placeholder="Email Address" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {data.fields.map(formField => (
                        <FormField
                            key={formField.value}
                            control={form.control}
                            name={formField.value}
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="capitalize">{camelCaseToRegular(formField.value)} <span className="text-xs text-neutral-500">(Optional)</span></FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                    <Button disabled={isLoading} className="w-full flex space-x-1.5" type="submit">
                        <span>Submit</span>
                        {!!isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    </Button>
                </form>
            </Form >
        </div>
    )
}

function AttractivoTooltip() {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger><InfoCircledIcon className="w-4 h-4" /></TooltipTrigger>
                <TooltipContent side="right" className="w-48">
                    <p>Attractivo: Simplifying lead generation and scheduling for small businesses.</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

function camelCaseToRegular(text: string) {
    return text.replace(/([A-Z])/g, ' $1').trim();
}